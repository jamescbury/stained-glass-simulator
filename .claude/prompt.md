# Design stained glass simulator

## Overview
The stained glass simulator is a web app that allows an artist to explore possibilities for creating stained glass designs.  They begin by building an inventory of the glass they have, or plan to have, by uploading a photo of the glass and tagging it with a name.  Multiple tags are available to help manage the inventory.  Then the artist uploads an SVG of the pattern they want to use.  If they don't have a pattern there are some simple geometric ones available as templates.  The pattern identifies each individual piece of the design as a separate object.  

The artist then selects each individual piece from the pattern, or several pieces, which opens a dialog box for them to select properties.  The properties allow them to select a specific piece of glass from their inventory. and to set it's rotation (some glass has a "grain" to it which looks better in certain orientations).  The app then fills the selected piece(s) with the image of the inventory at the specified rotation.  A piece can be reselected and adjusted as needed.

The end product is a simulation of what the finished piece will look like.  It allows the artist to adjust the glass and grain to get their desired outcome.  The artist can then choose to print the design for their own reference.

## Inputs

- **Glass Samples:** close up images of glass to be added to the inventory.  From the sample the color and type (cathdral, streaky, opaque, frosted) should be identifiable to an observer.  The app will attempt to "guess" at the sample properties based on the image uploaded
- **Template Patterns:** examples of stained glass templates stored as SVGs that can be used to visualize different glass configurations without a specific project in mind
- **Project Patterns:** an SVG that the artist uploads which can be used to select specific pieces
- **Background Image:** a background photo that can be placed behind the pattern to show how the different glass might distort a view.  The background image is also used to control the background lighting (a bright sunny sky vs. a starry night).  User can upload their own image, but stock images consist of: sunny sky, starry night, cloudy sky, sunrise, sunset

## Outputs

- Primary output is the UI tht the user interacts with to select glass and set orientation.  
- The ability to save the canvas to photos or to print

## Example

Artist is creating a stained glass image of a flower.  She creates an SVG of the flower she wants and breaks the path into individual shapes this is uploaded as a template.  The artist then adds several pieces of glass to her inventory that she is considering using for the flower.  With the inventory loaded the artist will click on each individual section of the flower template and select proper glass from her inventory.  For some pieces of glass she chooses to rotate the invetory image so that the grain aligns with the pattern.  Once it is set to her liking she prints out the filled in template.