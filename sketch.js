let logos = []
let timer = null

window.onload = function() {
    setup()
    updateAll()
}

function setup() {
    for (const svgElement of document.querySelectorAll("svg.logo")) {
        logos.push(new AnimatedLogo(svgElement))
    }
}

function updateAll() {
    logos[0].moveAnchors()
    logos[0].drawPath()
    for (const l of logos) {
        l.path.setAttribute("d", logos[0].path.getAttribute("d"))
    }
}

function toggleAuto() {
    if (timer == null) {
        updateAll()
        timer = setInterval(updateAll, 4000)
    } else {
        clearTimeout(timer)
        timer = null
    }
}
