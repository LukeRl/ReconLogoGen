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
 1) The generated shape does not reliably take up enough volume.
    - Modify the random distribution of the positive anchors to favour covering more volume.
 2) The generated shape strays from the centre of the logo area.
    - Incorporate into the solution above OR translate the centre of mass to the centre of the image (and ensure no overflow) .
 3) During the transition process sharp edges are created due to transitioning using `L` and `A` commands in the svg path.
    - replace all svg path commands with `C` (Bezier curves) to allow for smoother transitioning.
        - Straight lines can be represented by keeping the control points inline and the arcs can be mimicked closely (see https://spencermortensen.com/articles/bezier-circle/)
   

<font size="0.7" color="red">
   LR:
   
   1) Initially I thought this could just be fixed by ensuring a minimum angle between the anchors that scales according to how clustered they are; if only two anchors next to eachother 
      (i.e. within X degrees of eachother), then the minimum will be quite small to allow for those anchor points in close proximity, but if there are three or more within a given degree 
      around the origin, then the minimum is scaled higher for each anchor (going clockwise since anchors are sorted during path generation). Buuuut, this resulted in MUCH less variation
      to the point where it almost looked the like same logo rotated at a glance (if you take the time to check you can tell its new, but thats too much for randoms on the site). 
      
      I manually placed the anchors around and found that by jsut changiong the anchor positions the only way to get a higher avg area causes way too much reduction in the variation. Theres 
      either a lot of variance in the area, or there are no cool/unique shapes with long/thin sections. Having some sort of balancing alg that will add more 'fat' sections if it finds itself
      drawing enough 'thin' ones would be nice, but given I've only got a couple hours tongiht and you're busy too, ima just try and convince the guys that variation is more important and ur 
      initial way of doing it is fine. If they disagree I'll take the hit and do that ^^ shit. 
      
   2) I just set the path's transform attrib to translate by -CoM. I tried adding a check after to move any anchors that would be translated out of bounds but I found that it looked worse than 
      just letting it cut off. Proper solution would be to modify the path when translating and checking for out of bounds there rather than leaving the path as is and just 
      translating it, since when checking for out of bounds we could do some fancy shit to ensure the 'triangles' (origin -> 2 anchors) arent broken. 
      
   3)
   
   
   Side note: maybe the other way I did the generation and even a few new ways (e.g. pathfinding agents that walk randomly towards the center??) could still be chucked in and swapped between according to
   some heuristic like time (e.g. in the mornings the logos will be from your anchor + radial deductions around orign, after 11, maybe we use another script, after 4 another etc. so that the users wont 
   be able to obviously realise the diff but any freq users may notice trends from when they access the site.) or whatever.

</font>