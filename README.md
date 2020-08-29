
# TextEditor-API concepts

StyleIt is a simple text editor API built for Developers. <br/>
It outputs clean data in JSON instead of heavy HTML-markup for efficent data saving.  <br/>
More important StyleIt knows how to use ANY Css rule.

1. Clean data output
2. Use of any CSS rules
3. Style with classes


## Getting started

### Installation

1. Node package
2. Source from CDN
3. Local file from project


## Node module
<h6>Install the package via npm</h6>
<ul>
<li>
<code>
  npm i styleit-api --save
</code>
</li>
<li>
<p> Include the module in your application</p>
<code>import {StyelIt} from 'styleit-api';
</code>
</li>
</ul>
<br>
<br>
## Node.js package for SSR
<code>
  Coming soon!
</code>
<br>
<br>
## Load from CDN
<code>
coming soon!
</code>
<br>
<br>
##Initialization
In order to inizialize StyleIt, you need to pass the Element Object or Element Id to the StyleIt constracture.
Note that StyleIt will be available only on this element and its child nodes.
<div>
<code>
import {StyleIt} from 'styleit-api';
<br>
<br>
<span style="margin-top:20px">const styleIt = new  StyleIt(*Element Object or Element Id*);</span>
</code>
<br>
<br>
</div>

##StyleIt provides two working modes
<code>import {Modes} from 'styleit-api'</code>

<table style="width:100%">
  <tr>
    <th>Mode</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Toggle</td>
        <td>String</td>
    <td>Style elements with on/off functionality => like bold,underline,italic</td>
  </tr>
  <tr>
    <td>Extend</td>
    <td>String</td>
    <td>Only extends the currect style => font-size, color, backgorund</td>
  </tr>
</table>
<div>
Note that the Extend mod will not cancel the style when selecting the same rule twice.
</div>
<br>
<br>
##How to use
<p>Modes.Toggle</p>
<code>
styleIt.execCmd('text-decoration', 'underline', Modes.Toggle);
<br>
<br>
styleIt.execCmd('font-weight', 'bold', Modes.Toggle);
</code>
<br>
<br>
<p>Modes.Extend</p>
<code>
styleIt.execCmd('color', color, Modes.Extend);
<br>
<br>
styleIt.execCmd('font-size', size, Modes.Extend);
</code>
<br>
<br>
##Css Class API
The Css Class API lets you create a Css class with your pre-made rules.
You can pass this class to a StyleIt object and use it as a markup just like underline or bold.
### How to use
<code>
styleIt.ToggleClass("class-name")
</code>
##API Tools

<table style="width:100%">
  <tr>
    <th>Tool</th>
    <th>Configuration</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Undo Redo</td>
    <td>None</td>
    <td>Coming soon!</td>
  </tr>
  <tr>
    <td>Copy Paste</td>
    <td>None</td>
    <td>Copies the text with it's style. (Works only when using Copy/Paste inside a StyleIt Holder)</td>
  </tr>
    <tr>
    <td>Caret</td>
    <td>...</td>
    <td>Coming soon!</td>
  </tr>
      <tr>
    <td>Text selection</td>
    <td>...</td>
    <td>Coming soon!</td>
  </tr>
    <tr>
    <td>Inspector</td>
    <td>  const config = {<br/>
        onInspect: (styles) => {<br/>
          // the styles on the element..<br/>
        },<br/>
        const styleIt = new  StyleIt(*Element Object or Element Id*,config);
      }
      </td>
    <td>    The inspector will trigger your function on every style change with the style in a key-value format.
</td>
  </tr>
</table>
<br>
<br>

###OnLoad Function
###### Tells StyleIt to rerender the html inside the holder element without deleting any data.
###### It will reomove all invalid tags and chars.

###Save Function
###### styleIt.Save(); 
###### Will create a clean JSON from your content. Note that this function will also filter every invalid tags and chars.

###Load
###### styleIt.Load(savedJson); 
###### Will create a html markup from your JOSN content and will append it into the end of the editor. Note that this function will also filter every invalid tags and chars.
and will inject it into the container.

###### Load can use only json Data from the Save method.

###Destroy

###### styleIt.Destroy();
###### Will remove all StyleIt functionality.

###Known Issues
1. on merge elements, underline with color will loose the color and turn to black.

2. Style tag, such as <b>, not valid, only spans.

