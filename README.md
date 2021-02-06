StyleIt
==============

StyleIt.js is a simple text editor API built for Developers.
It can give your App superpowers to do things that you never thought possible.

### Install ###

npm i styleit-api --save

### API Overview ###

Basic Usage

```js
  import StyleIt from 'styleit-api';
  const styleIt = new StyleIt("editor-id");
  cont MODES = styleIt.MODES;

  const underline =()=> styleIt.execCmd('text-decoration', 'underline', Modes.Toggle);
const bold =()=> styleIt.execCmd('font-weight', 'bold', MODES.Toggle);
```

### Full documentation ###

[Home page](https://style-it.github.io/home)