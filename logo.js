//Anchor class: effectively vectors with radii
//TODO: should be in the vector.js file as a circle
class Anchor extends Vector {
    constructor(x, y, r) {
        super(x, y)
        this.r = r
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
        this.debugG = document.createElementNS("http://www.w3.org/2000/svg", "g")
        this.svgElement.appendChild(this.path)
        this.svgElement.appendChild(this.debugG)

        //The intial state
        //TODO: map in the approved intial state
        this.path.setAttribute("d", "M5.976725872138284 3.130511118834665 A0.8333333333333333 0.8333333333333333 0 0 1 5.63626727821527 3.9287345831517344 L4.524970842919703 -3.7089473449707158A0 0 0 0 0 4.524970842919703 -3.7089473449707158 L3.4136744076241357 -11.346629273093166A1.3888888888888888 1.3888888888888888 0 0 1 4.58993279254477 -12.921289561594145 L11.25162111126562 -13.881561352746916A-4.209938399935119 -4.209938399935119 0 0 0 14.672931091067506 -16.804470487920344 L18.25709514491284 -28.39274389574672A3.888888888888889 3.888888888888889 0 0 1 25.82561398400233 -26.71855126536515 L20.11222413378761 15.207593528300674A-6.312451068739064 -6.312451068739064 0 0 0 21.8257716404284 20.444618857256714 L32.241935617734384 31.232340766680554A5 5 0 0 1 25.26847735147872 38.39308267679209 L3.030622451959855 18.031682173979664A-6.2235234761705716 -6.2235234761705716 0 0 0 -5.427363623447784 18.0802518622712 L-20.604896099141975 32.300953530134166A4.166666666666667 4.166666666666667 0 0 1 -25.874728752765623 25.869214969942334 L-9.949001440313669 14.4998630443885A0 0 0 0 0 -9.949001440313669 14.4998630443885 L5.976725872138284 3.130511118834665")

        this.positiveAnchors = this.radii.map(r => new Anchor(0, 0, r))
        this.negativeAnchors = this.radii.map(r => new Anchor(0, 0, 0))
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
        for (const [i, anchor] of this.positiveAnchors.entries()) {
            let theta = Math.random() * Math.PI * 2
            anchor.x = Math.cos(theta) * this.dists[i]
            anchor.y = Math.sin(theta) * this.dists[i]
        }

        //Calculates the geometric center
        let center = new Anchor(...Vector.average(...this.positiveAnchors), 0)
        this.positiveAnchors.sort((a, b) => center.angleTo(a) - center.angleTo(b))
        this.debugG.innerHTML = ""
        for (const [i, anchor] of this.negativeAnchors.entries()) {
            let a = this.positiveAnchors[i]
            let b = this.positiveAnchors[(i + 1) % this.positiveAnchors.length]

            //Create the triangle
            let c_a = tangent(center, a.neg())
            let c_b = tangent(center, b)
            let a_b = tangent(a, b)

            let A = intercept(...c_a, ...a_b)
            let B = intercept(...c_b, ...a_b)
            let C = center

            //Get random point
            let pt = randomInTriangle(A, B, C)
            let r = Math.min(distToSegment(pt, C, A), distToSegment(pt, C, B))

            let da = C.angleTo(B) - C.angleTo(A)

            if (Math.atan2(Math.sin(da), Math.cos(da)) > 0 && r >= 1) {
                anchor.x = pt.x
                anchor.y = pt.y
                anchor.r = -r
                this.debugG.innerHTML += `<polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}" style="fill:#8082" />`
            } else {
                let m = tangent(a, b)
                let d = m[1].sub(m[0])
                pt = m[0].add(d.mult(5/6))
                anchor.x = pt.x
                anchor.y = pt.y
                anchor.r = 0
            }
        }
    }

    drawAnchors() {
        let center = Vector.average(...this.positiveAnchors)
        let g = `<circle cx=${center.x} cy=${center.y} r=${2} style="fill:#0802"n"/>`
        for (const anchor of this.positiveAnchors) {
            g += `<circle cx=${anchor.x} cy=${anchor.y} r=${anchor.r} style="fill:#8002""/>`
        }
        for (const anchor of this.negativeAnchors) {
            if (anchor.r !== 0) {
                g += `<circle cx=${anchor.x} cy=${anchor.y} r=${Math.abs(anchor.r)} style="fill:#0082"/>`
            }
        }
        this.debugG.innerHTML += g
    }

    //Creates the svg path for the logo
    drawPath() {
        let anchors = this.positiveAnchors.flatMap((a, i) => [a, this.negativeAnchors[i]])
        let path = `m${tangent(anchors[0], anchors[1])[0]} `
        for (let i = 0; i < anchors.length; i++) {
            let a = anchors[i]
            let b = anchors[(i + 1) % anchors.length]
            let c = anchors[(i + 2) % anchors.length]

            if (b.r !== 0) {
                let m = Vector.average(...tangent(a, b))
                path += `C${m} ${m} ` + arcToBezier(b, tangentAngle(a, b), tangentAngle(b, c), b.r > 0)
            } else {
                let n = 6 + 2
                let m = tangent(a, c)
                let d = m[1].sub(m[0])
                for (let i = 1; i < n; i++) {
                    let c = m[0].add(d.mult((i - 0.5)/n))
                    path += `C${c} ${c} ${m[0].add(d.mult(i/n))}`
                }
            }
            this.path.setAttribute("d", path)
            let z = 2
        }
        this.path.setAttribute("d", path)
    }

    drawPathOld() {

        // Centering the lazy way. Could be improved by actually calcing path vertices*translation to keep it all in the 'd' attrib
        let transformAtt = "translate(" +((CoM.x)*-1).toString() + "," + ((CoM.y)*-1).toString() + ")"
        this.path.setAttribute("transform", transformAtt)
    }
}

//Supporting math functions
//TODO: rewrite and move into vector.js
function arcToBezier(anchor, startAngle, endAngle, isClockwise) {
    let n = 6

    //Angle distance for each segment of the arc
    let angleDelta
    if (isClockwise) {
        if (endAngle < startAngle) {
            endAngle += 2*Math.PI
        }
        angleDelta = (endAngle - startAngle) / n
    } else {
        if (endAngle > startAngle) {
            endAngle -= 2*Math.PI
        }
        angleDelta = (endAngle - startAngle) / n
    }

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
    let f1 = new Vector(
        c1.x + Math.cos(theta) * c1.r,
        c1.y + Math.sin(theta) * c1.r
    )
    let f2 = new Vector(
        c2.x + Math.cos(theta) * c2.r,
        c2.y + Math.sin(theta) * c2.r
    )
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

Array.prototype.zip = function(arr) {
    if (!arr) {
        arr = this.slice()
        arr.push(arr.shift())
    }
    return Array.from(
        Array(Math.max(this.length, arr.length)),
        (_, i) => [this[i], arr[i]]
    )
}
