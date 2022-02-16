# Usage Guide:
1. Link the javascript files `vector.js`, `logos.js` (in that order) and the css file `logoStyles.css` in the page's html
2. Create all svg elements in the site html with the css class `logo` and set their size either inline or with css
3. Call the static `AnimatedLogo.setup()` function once the page has loaded with javascript

e.g.:
```
<link rel="stylesheet" href="logoStyles.css">
<script src="vector.js"></script>
<script src="logo.js"></script>

<style>
    .logo {
        width: 100px;
        height: 100px;
    }
</style>

<svg class="logo" />

<script>
    window.onload = AnimatedLogo.setup()
</script>
```


# Development notes:
#### Requirements
 - A smoothly transitioning logo between defined and individually aesthetic states.
 - Each individual state should be based on 5 points representing the 5 letters of recon (these points will be refered to as positive anchors).
    - The size and distance from the centre are proportional to their position in the alphabet [18, 5, 3, 15, 14].
 - The design should incorporate both curves and straight lines .
    - Straight lines should occur more often when two or more positive anchors are close together.
 - Must be able to create overhanging / outcropping features or hooked shapes.
 - Must support all modern browsers (not IE).
    - Must have a fall back for older browsers (a static image is enough)
 - Displays the image in an svg element on the website.

 - A testing site / dashboard which allows boxercox to quickly generate different logo states (without the transition / very short transition) for use in promotional material.
    - Allows for the easy extraction of the svg path to be imported into Adobe Illustrator or other vector editing applications.
 - The algorithm must be totally generative (randomly generated) creating interesting shapes continually unique to each runtime of the algorithm.

#### Existing Implementation
The implementation for the logo algorithm exists in the files `vector.js`, `logos.js`, `logoStyles.css`. The other files are for testing and may lay the grounds for the boxercox dashboard / testing site.

The current algorithm follows this process:
 - Initial setup
    - Selects all svg elements of the css class `.logo`.
    - Creates an svg path element as well as setting the viewbox and svg version / reference.
    - Initialise classes and variables.
 - Logo state generation
    - Randomly distribute positive anchors around the centre of the logo proportionate to the letter they represents position in the alphabet.
    - Calculate a centre of mass.
    - Randomly place negative anchors within the triangle bounded by two positive anchors and the centre of mass.
       - In the cases where this cannot be done draw a straight line following the external tangent from the two anchor points.
    - Draw a path around the external side of the positive anchors (from the centre of mass) and the internal side of the negative anchors (weaving back and forth).
    - Set the value of the svg path to the generated path.

Issues:
 - The generated shape does not reliably take up enough volume.
    - Modify the random distribution of the positive anchors to favour covering more volume.
 - The generated shape strays from the centre of the logo area.
    - Incorporate into the solution above OR translate the centre of mass to the centre of the image (and ensure no overflow) .
 - During the transition process sharp edges are created due to transitioning using `L` and `A` commands in the svg path.
    - replace all svg path commands with `C` (Bezier curves) to allow for smoother transitioning.
        - Straight lines can be represented by keeping the control points inline and the arcs can be mimicked closely (see https://spencermortensen.com/articles/bezier-circle/)
