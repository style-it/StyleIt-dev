StyleIt
==============

 ### StyleIt.js is A completely customizable for building rich text editors in the browser.

## Keep the following in mind
* StyleIt.js is an abstraction, please know that there is no UI.
* This repo was built for study purposes.
* Undo/Redo will come in the future


## DEMO ##

[try me](https://codesandbox.io/s/styleit-8irnj?file=/index.html)

# API Overview #  

### Install ###

```js
npm i styleit-api --save
```

### Include the module in your application ###

```js
import StyleIt from 'styleit-api';
```

### StyleIt provides two working modes ###

| Mode        | Description |
| ----------- | ----------- |
| Toggle      | Style elements with on/off functionality, like bold,underline,italic|
|             |
| Extend      | Only extends the currect style, font-size, color, backgorund|

## Basic Usage ##

### Toggle ###

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");
1cont MODES = styleIt.MODES;

const underline =()=> styleIt.execCmd('text-decoration', 'underline', Modes.Toggle);
const bold =()=> styleIt.execCmd('font-weight', 'bold', MODES.Toggle);
```

### Extend ###

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");
cont MODES = styleIt.MODES;

const changeColor =(color)=> styleIt.execCmd('color', color, MODES.Extend);
const changeSize =(size)=> styleIt.execCmd('font-size', size, MODES.Extend);
```
### With Options ###

The textAlign, padding, margin, line-height and more property sets the horizontal alignment of text in a block level element. It must be used on a block level element (p, div, etc.)

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");
const MODES = styleIt.MODES;

const changeAlign =(align)=> styleIt.execCmd('text-align', align, MODES.Extend,{
target:'block'
});
```

## Inspector ##

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");

styleIt.on("inspect",(collectedStyles) => {
// do something with the styles..
})
```

## Format Block ##

Adds an HTML block-level element around the line containing the current selection.

### Tags ### 

| Tag Name    |
| ----------- |
| H1|
| H2|
| H3|
| H4|
| H5|
| H6|
| P |
| PRE |
| ADDRESS |

### How to use ###

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");

const toggleClass = (tagName)=> styleIt.formatBlock(tagName);

```
## Style with Tags (toggle mode) ##

| Tag Name    | 
| ----------- |
| B |
| STRONG      |
| MARK      |
| EM      |
| I      |
| S      |
| STRIKE      |
| DEL      |
| U      |
| SUB      |
| SUP      |
| SMALL      |
| SUB      |

### How to use ###

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");

styleIt.toggleWith("strong");

```

## Css Class API ##

The Css Class API lets you create a Css class with your pre-made rules. You can pass this class to a StyleIt object and use it as a markup just like underline or bold.

### How to use ###

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");

const toggleClass = (name)=> styleIt.toggleClass(name);

```

## Links ##

### How to use ###

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");

const createLink = () => styleIt.link({
href:'styleIt.com',
protocol:'https'
target:'_blank'
});
```

## Links Inspector ##

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");

styleIt.on("inspectLink",(props) => {
// {href,protocl,target,element}
})
```

## Save Function ##

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");

const contentAsJson = styleIt.save();
```

## Load Function ##

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");

styleIt.load(contentAsJson);
```

## Destroy ##

Will remove all StyleIt functionality.

```js
import StyleIt from 'styleit-api';
const styleIt = new StyleIt("editor-id");

styleIt.destroy();
```

### Contributing
All contributions are super welcome!

[Home Page](https://style-it.github.io/home) | [Got questions?](mailto:styleit.api@gmail.com)