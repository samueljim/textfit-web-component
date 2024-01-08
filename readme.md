# textfit

This package only needs to be imported once as web components extend the HTML object. You can use this just like a `div` or `h1` tag after you import the module

```html
<script type="module">import "./node-modules/textfit-web-component/textfit.js"</script>

<body>
    <div>
        <text-fit max-lines="1">
            hello world
        </text-fit>
    </div>
</body>
```

you can also use this in a framework like react as long as it's imported before it's used since it's just adding a new html tag to the dom. This can be in the html file, top level index.js entry point or even in the same file.

```jsx
import 'textfit-web-component'

const ReactComponent = () => {
    return (
        <div>
            <text-fit max-lines="1">
                hello react world
            </text-fit>
        </div>
    )
}
```

if you want a element to be based of the hight of something else then you can use the max-height props
```html
<div style="height: 20px;">
    <text-fit max-height="parent">
        max height based on parent
    </text-fit>
</div>
```
```html
<div style="height: 20px;">
    <text-fit max-height="300">
        max height is 300px 
    </text-fit>
</div>
```

if you just want to use textfit for line counting you can disable the font resizing with the `disable-dynamic-font-size` prop

```html
<text-fit disable-dynamic-font-size id="target">
    hello
</text-fit>

<script>
    document.querySelector('#id').lineCount; // 1
</script>
```
