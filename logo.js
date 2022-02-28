//Anchor class: effectively vectors with radii
//TODO: should be in the vector.js file as a circle
class Anchor extends Vector {
    constructor(x, y, r) {
        super(x, y)
        this.r = r
    }

    duplicate() {
        return new Anchor(this.x, this.y, this.r)
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
        this.svgElement.appendChild(this.path)

        //The intial state
        //TODO: map in the approved intial state
        this.path.setAttribute("d", "M5.976725872138284 3.130511118834665 A0.8333333333333333 0.8333333333333333 0 0 1 5.63626727821527 3.9287345831517344 L4.524970842919703 -3.7089473449707158A0 0 0 0 0 4.524970842919703 -3.7089473449707158 L3.4136744076241357 -11.346629273093166A1.3888888888888888 1.3888888888888888 0 0 1 4.58993279254477 -12.921289561594145 L11.25162111126562 -13.881561352746916A-4.209938399935119 -4.209938399935119 0 0 0 14.672931091067506 -16.804470487920344 L18.25709514491284 -28.39274389574672A3.888888888888889 3.888888888888889 0 0 1 25.82561398400233 -26.71855126536515 L20.11222413378761 15.207593528300674A-6.312451068739064 -6.312451068739064 0 0 0 21.8257716404284 20.444618857256714 L32.241935617734384 31.232340766680554A5 5 0 0 1 25.26847735147872 38.39308267679209 L3.030622451959855 18.031682173979664A-6.2235234761705716 -6.2235234761705716 0 0 0 -5.427363623447784 18.0802518622712 L-20.604896099141975 32.300953530134166A4.166666666666667 4.166666666666667 0 0 1 -25.874728752765623 25.869214969942334 L-9.949001440313669 14.4998630443885A0 0 0 0 0 -9.949001440313669 14.4998630443885 L5.976725872138284 3.130511118834665")

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

    //Creates the svg path for the logo
    drawPath() {
        let anchors = this.anchors.slice(0)

        //Calculates the centre of mass
        let CoM = Vector.average(...anchors)

        //Sorts the anchors clockwise around the centre of mass
        anchors.sort((a, b) => CoM.angleTo(a) - CoM.angleTo(b))

        //Generate random point in the triangle generated from the tangents of each clockwise anchor pain and the centre of mass
        //TODO: move this into the "moveAnchors" function
        anchors = anchors.zip().flatMap(([a, b]) => {
            let CoM_a = tangent(CoM, a.neg())
            let CoM_b = tangent(CoM, b)
            let a_b = tangent(a, b)

            let p_a = intercept(...CoM_a, ...a_b)
            let p_b = intercept(...CoM_b, ...a_b)

            let pt = randomInTriangle(p_a, p_b, CoM)
            let r = Math.min(distToSegment(pt, CoM, p_a), distToSegment(pt, CoM, p_b))

            let da = CoM.angleTo(CoM_b[1]) - CoM.angleTo(CoM_a[1])

            if (Math.atan2(Math.sin(da), Math.cos(da)) > 0 && r >= 1) {
                return [a, new Anchor(...pt, -r)]
            }
            return [a, new Anchor(...Vector.average(...tangent(a, b)), 0)]
        })

        let pathArray = []
        for (const [a, b] of anchors.zip()) {
            pathArray.push([a.r, ...tangent(a, b)])
        }



        let k = 0 //dont judge, cbf changing loop for an iterator
        let path = `M${pathArray.at(-1).at(-1)} `
        let pathOld = `M${pathArray.at(-1).at(-1)} `
        for (const [r, a, b] of pathArray) {

            pathOld += `A${r} ${r} 0 0 ${r > 0 ? 1 : 0} ${a} L${b}`


            let sweep
            if(k % 2 == 0){
                sweep = 0
            }else{
                sweep = 1
            }
            let currPoint = a
            let nextPoint = b
            let prevPoint = []
            if (k == 0){
                prevPoint = pathArray.at(-1).at(-1)
            }else{
                prevPoint = pathArray[k-1][2]   // 'b' point from previous elemnet
            }

            let bezSegments = arcToBezier({
                px: prevPoint.x,
                py: prevPoint.y,
                cx: currPoint.x,
                cy: currPoint.y,
                rx: r,
                ry: r,
                xAxisRotation: 0,
                largeArcFlag: 0,
                sweepFlag: r > 0 ? 1 : 0,
            });

            /// CANT CHANGE NUM OF CMDS IN PATH, add 4 beziers every time
            let lastPoint = []
            if (bezSegments.length==0){
                lastPoint = [currPoint.x, currPoint.y]
            }
            for(let i=0; i<4; i++){

                if (i<bezSegments.length){
                    path += `C${bezSegments[i]['x1']} ${bezSegments[i]['y1']} ${bezSegments[i]['x2']} ${bezSegments[i]['y2']} ${bezSegments[i]['x']} ${bezSegments[i]['y']}`
                    lastPoint = [bezSegments[i]['x'],bezSegments[i]['y']]
                    this.path.setAttribute("d", path)
                }else{
                    path += `C${lastPoint[0]} ${lastPoint[1]} ${lastPoint[0]} ${lastPoint[1]} ${lastPoint[0]} ${lastPoint[1]}` // Should really adjust the arcToBezier to always break into 4 segs, but fuck that.
                    this.path.setAttribute("d", path)
                }
            }

            let nextLineMidPoint = midpoint(currPoint.x,currPoint.y,nextPoint.x,nextPoint.y)
            let cntrlPoint1 = midpoint(currPoint.x,currPoint.y,nextLineMidPoint[0],nextLineMidPoint[1])
            let cntrlPoint2 = midpoint(nextLineMidPoint[0],nextLineMidPoint[1],nextPoint.x,nextPoint.y)

            //path += `L${nextPoint}`
            path += `C${cntrlPoint1[0]} ${cntrlPoint1[1]} ${cntrlPoint2[0]} ${cntrlPoint2[1]} ${nextPoint.x} ${nextPoint.y}`
            k++
            this.path.setAttribute("d", path)

            /// good enough for now. not using the tangents properly. its 5am. sleep time.

        }
        console.log(path)
        console.log("===================================")
        console.log(pathOld)

        this.path.setAttribute("d", path)

        // Centering the lazy way. Could be improved by actually calcing path vertices*translation to keep it all in the 'd' attrib
        let transformAtt = "translate(" +((CoM.x)*-1).toString() + "," + ((CoM.y)*-1).toString() + ")"
        this.path.setAttribute("transform", transformAtt)
        //this.path.setAttribute("stroke-linejoin", 'round')
    }
}

//Supporting math functions
//TODO: rewrite and move into vector.js

function midpoint(x1, y1, x2, y2) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
}

function tangent(c1, c2) {
    if (c1.dist(c2) == 0) {return [c1, c2]}
    let theta = tangentAngle(c1, c2)
    let f1 = new Vector(
        c1.x + Math.cos(theta) * (c1.r ? c1.r : 0),
        c1.y + Math.sin(theta) * (c1.r ? c1.r : 0)
    )
    let f2 = new Vector(
        c2.x + Math.cos(theta) * (c2.r ? c2.r : 0),
        c2.y + Math.sin(theta) * (c2.r ? c2.r : 0)
    )
    return [f1, f2]
}

function tangentAngle(c1, c2) {
    let r_diff = (c2.r ? c2.r : 0) - (c1.r ? c1.r : 0)
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
