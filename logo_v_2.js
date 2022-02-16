//Anchor class: effectively vectors with radii
//TODO: should be in the vector.js file as a circle
class Anchor extends Vector {
    constructor(x, y, r) {
        super(x, y)
        this.r = x.r || (x instanceof Vector ? y : r)
    }

    neg() {
        return new Anchor(this.x, this.y, -this.r)
    }
}

//Each instance of the logo is its on instance of this class
class AnimatedLogo {
    //Creates and begins animating all logos on the site
    static setup() {
        for (const svgElement of document.querySelectorAll("svg.logo")) {
            let logo = new AnimatedLogo(svgElement)
            logo.queueEvolve()
        }
    }

    constructor(svgElement) {
        //The distances of the 5 points from the center of the logo
        let vals = [18, 5, 3, 15, 14]
        this.radii = vals.map(x => x / 18 * 5)
        this.dists = vals.map((x, i)=>x/18 * 50 - this.radii[i])
        this.svgElement = svgElement
        this.setup()
    }

    //Handles the setup of the various variables and svg elements used to draw the logo
    setup() {
        this.svgElement.setAttribute("viewBox", "-50 -50 100 100")
        this.svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        this.path = document.createElementNS("http://www.w3.org/2000/svg", "path")
        this.devPathP = document.createElementNS("http://www.w3.org/2000/svg", "path")
        this.devPathN = document.createElementNS("http://www.w3.org/2000/svg", "path")

        // this.path.setAttribute("d", initialLogoState)

        this.svgElement.appendChild(this.path)
        this.svgElement.appendChild(this.devPathP)
        this.svgElement.appendChild(this.devPathN)

        this.anchors = this.radii.map(r => new Anchor(0, 0, r))
    }

    queueEvolve() {
        //Variance to make it more interesting (especially if more than one logo is present on screen)
        setTimeout(this.evolve.bind(this), 3500 + Math.random() * 1000)
    }

    //Evolves the logo to the next state
    evolve() {
        this.moveAnchors()
        this.drawPath()
        this.queueEvolve()
    }

    //Moves the anchors to a new random position
    moveAnchors() {
        for (const [i, anchor] of this.anchors.entries()) {
            let theta = Math.random() * Math.PI * 2
            anchor.x = Math.cos(theta) * this.dists[i]
            anchor.y = Math.sin(theta) * this.dists[i]
        }
    }

    drawPath() {
        let anchors = this.anchors.slice(0)

        //Calculates the centre of mass
        let centre = new Anchor(Vector.average(...anchors), 0)

        //Sorts the anchors clockwise around the centre of mass
        anchors.sort((a, b) => centre.angleTo(a) - centre.angleTo(b))

        //Generate random point in the triangle generated from the tangents of each clockwise anchor pain and the centre of mass
        //TODO: move this into the "moveAnchors" function
        anchors = anchors.flatMap((a, i) => {
            let b = anchors[(i + 1) % anchors.length]
            let centre_a = tangent(centre, a.neg())
            let centre_b = tangent(centre, b)
            let a_b = tangent(a, b)

            let p_a = intercept(...centre_a, ...a_b)
            let p_b = intercept(...centre_b, ...a_b)

            let pt = randomInTriangle(p_a, p_b, centre)
            let r = Math.min(distToSegment(pt, centre, p_a), distToSegment(pt, centre, p_b))

            let da = centre.angleTo(centre_b[1]) - centre.angleTo(centre_a[1])

            let n

            if (Math.atan2(Math.sin(da), Math.cos(da)) > 0 && r >= 1) {
                n = new Anchor(pt, -r)
            } else {
                n = new Anchor(Vector.average(...a_b), 0)
            }
            return [a, n]
        })

        this.devPathP.setAttribute("d", anchors.filter(a => a.r >  0).map(a => `M ${a} m -${Math.abs(a.r)} 0 a ${Math.abs(a.r)} ${Math.abs(a.r)} 0 0 0 ${2*Math.abs(a.r)} 0 a ${Math.abs(a.r)} ${Math.abs(a.r)} 0 0 0 -${2*Math.abs(a.r)} 0`))
        this.devPathN.setAttribute("d", anchors.filter(a => a.r <= 0).map(a => `M ${a} m -${Math.abs(a.r)} 0 a ${Math.abs(a.r)} ${Math.abs(a.r)} 0 0 0 ${2*Math.abs(a.r)} 0 a ${Math.abs(a.r)} ${Math.abs(a.r)} 0 0 0 -${2*Math.abs(a.r)} 0`))

        //Generates the svg path for the logo
        //TODO: refactor
        let path = anchors.map((a, i) => {
            let b = anchors[(i + 1) % anchors.length]
            let c = anchors[(i + 2) % anchors.length]

            let ta1 = tangentAngle(a, b)
            let ta2 = tangentAngle(b, c)
            let p1 = a.add(Vector.angMag(ta1, a.r))

            if (b.r == 0) {
                let a_c = tangent(a, c)
                let temp = `L${a_c[0]}` + ("C" + `${a_c[0]} `.repeat(3)).repeat(2) + ("C" + `${a_c[1]} `.repeat(3)).repeat(2)
                return temp
            }
            return `L${bezierCircle(b, ta1, ta2, b.r > 0)}`
        }).join(" ")

        console.log(path.replace(/[^a-zA-Z]/g, ""))

        this.path.setAttribute("d", "M" + path.slice(1) + `Z M${centre} m-2 0 l4 0 m-2 -2 l0 4`)
    }
}

//Supporting math functions
//TODO: rewrite and move into vector.js

//Belongs in (currently non-existant) circle class
function bezierCircle(anchor, startAngle, endAngle, isClockwise) {
    let n = 4

    //Angle distance for each segment of the arc
    let angleDelta
    if (isClockwise) {
        angleDelta = ((endAngle + 4*Math.PI - startAngle) % (2 * Math.PI)) / n
    } else {
        angleDelta = ((endAngle - 2*Math.PI - startAngle) % (2 * Math.PI)) / n
    }

    //Length of control point (from: https://stackoverflow.com/questions/1734745/how-to-create-circle-with-bézier-curves)
    let m = (4 / 3) * Math.tan(Math.PI / (4 * Math.PI / angleDelta)) * anchor.r

    let pathString = `${anchor.add(Vector.angMag(startAngle, anchor.r))}`
    for (let i = 0; i < n; i++) {
        let p1 = {}
        p1.angle = startAngle + angleDelta * i
        p1.anchor = anchor.add(Vector.angMag(p1.angle, anchor.r))
        p1.control = p1.anchor.add(Vector.angMag(p1.angle + Math.PI/2, m))

        let p2 = {}
        p2.angle = startAngle + angleDelta * (i + 1)
        p2.anchor = anchor.add(Vector.angMag(p2.angle, anchor.r))
        p2.control = p2.anchor.add(Vector.angMag(p2.angle - Math.PI/2, m))

        pathString += `C${p1.control} ${p2.control} ${p2.anchor}`
    }
    return pathString
}

function tangent(c1, c2) {
    if (c1.dist(c2) == 0) {return [c1, c2]}
    let theta = tangentAngle(c1, c2)
    let f1 = c1.add(Vector.angMag(theta, c1.r))
    let f2 = c2.add(Vector.angMag(theta, c2.r))
    return [f1, f2]
}

function tangentAngle(c1, c2) {
    let r_diff = c2.r - c1.r
    return c2.angleTo(c1) + Math.acos(r_diff/c1.dist(c2))
}

function distToSegment(p, v, w) {
  var l2 = Math.pow(v.dist(w), 2)
  var t = (p.sub(v)).dot(w.sub(v)) / l2;
  return p.dist(v.add(w.sub(v).mult(t)))
}

function intercept(p1, p2, p3, p4) {
    let D = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)
    return new Vector(
        ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) - (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / D,
        ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / D
    )
}

function randomInTriangle(a, b, c) {
    let r1 = Math.random()
    let r2 = Math.random()
    return new Vector(
        (1 - Math.sqrt(r1)) * a.x + (Math.sqrt(r1) * (1 - r2)) * b.x + (Math.sqrt(r1) * r2) * c.x,
        (1 - Math.sqrt(r1)) * a.y + (Math.sqrt(r1) * (1 - r2)) * b.y + (Math.sqrt(r1) * r2) * c.y
    )
}
