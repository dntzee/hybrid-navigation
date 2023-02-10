# 容器与导航

本库内置 drawer、tabs、stack、screen 四种布局对象，前三种也被称为容器对象，因为它们可以容纳其它布局对象。

## Navigator

Navigator 是一个主管导航的类，它有一些静态（类）方法：

### setRoot

`setRoot(layout, sticky = false)` 设置应用的 UI 层级。

hybrid-navigation 一共有内置四种布局: screen, stack, tabs 以及 drawer。最简单的布局只有一个页面，我们用 screen 来表示，它不可以包含其它布局对象。

```js
Navigator.setRoot({
  screen: {
    moduleName: 'Navigation', // required
    props: {},
    options: {},
  },
})
```

screen 布局对象有三个属性，分别是 moduleName, props, options，其中 moduleName 是必须的，它就是我们上面注册的那些模块名，props 是我们要传递给该页面的初始属性，options 的类型是 `NavigationItem`，通常不会设置这个参数，而是通过[静态配置页面](./style.md#静态配置页面)来定制页面样式。

如果需要使用 push 或 pop 等导航功能在不同页面之间进行切换，那么我们需要 stack。

stack 布局对象有两个属性，分别是 children, options，其中 children 是必须的，它是一个表示布局对象的数组，options 用来配置 stack 的其它属性，暂时没有什么用。

```js
Navigator.setRoot({
  stack: {
    children: [{ screen: { moduleName: 'Navigation' } }], // required
    options: {},
  },
})
```

> :exclamation: **注意：stack 中 不可嵌套 stack**

如果我们需要像微信那样，底部有几个 tab 可以切换，那么我们需要用到 tabs。

tabs 布局对象有 children, options 两个属性，其中 children 是必须的，它是一个表示布局对象的数组，options 用来配置 tabs 的其它属性。

```javascript
Navigator.setRoot({
  tabs: {
    children: [
      {
        stack: {
          children: [{ screen: { moduleName: 'Navigation' } }],
        },
      },
      {
        stack: {
          children: [{ screen: { moduleName: 'Options' } }],
        },
      },
    ],
    options: {
      selectedIndex: 1, // 默认选中的 tab
      tabBarModuleName: 'CustomTabBar',
      sizeIndeterminate: true, // 如果希望自定义 TabBar 实现中间凸起效果，必须指定这个字段。
    },
  },
})
```

tabs 有一个默认的 TabBar， 支持未读消息数，小红点提示等功能。你也可以通过在 options 中传递 tabBarModuleName 来实现自定义 TabBar，但此时未读消息数，小红点提示等功能均需要你自己实现。如何自定义 TabBar, 请参考[自定义 TabBar](./custom-tabbar.md)。

::: warning
`tabBarModuleName` 指定的组件也需要通过 `ReactRegistry.registerComponent` 进行注册
:::

抽屉(drawer) 起源于 Android，不过我们在 iOS 也支持了它。

drawer 布局对象有 children, options 两个属性，其中 children 是必须的，它是一个表示布局对象的数组，长度必须为 2. options 用来配置 drawer 的其它属性。

```js
Navigator.setRoot({
  drawer: {
    children: [
      {
        stack: {
          children: [{ screen: { moduleName: 'Navigation' } }],
        },
      },
      {
        { screen: { moduleName: 'Menu' } },
      },
    ],
    options: {
      maxDrawerWidth: 240, // Menu 的最大宽度
      minDrawerMargin: 60, // Menu 右侧需要预留的最小空间
      menuInteractive: true // 是否可以通过手势打开 menu
    },
  },
});
```

至此，四种内置布局就已经介绍完成了，我们也可以自定义布局（容器）和导航，[deck](https://github.com/listenzz/hybrid-navigation-deck) 就是一个自定义容器，不过这是比较高级的话题了。

::: tip
可以先通过 `Navigator.setRoot` 设置一个入口页面，然后根据应用状态再次调用 `Navigator.setRoot` 决定要进入哪个页面。
:::

::: tip
Navigator.setRoot 还接受第二个参数，是个 boolean，用来决定 Android 按返回键退出 app 后，再次打开时，是否恢复到首次将该参数设置为 true 时的那个 layout。通常用来决定按返回键退出 app 后重新打开时，要不要走闪屏逻辑。请参考 [iReading Fork](https://github.com/listenzz/reading) 这个项目对 Navigator.setRoot 的使用
:::

### setRootLayoutUpdateListener

`setRootLayoutUpdateListener(willSetRoot = () => {}, didSetRoot = () => {})` 监听 `setRoot` 的调用，在前后插入相应逻辑。

### dispatch

`dispatch(sceneId, action, params): Promise<boolean>` 派发导航操作，返回一个 Promise，表示是否成功派发。

大多数导航操作，譬如 `push`、`pop` 都是转发给该方法完成，也可以直接使用，尤其是自定义了容器和导航之后。

```js
// 以下两行代码的效果是等同的
Navigator.dispatch(this.props.sceneId, 'push', { moduleName: 'Profile' })
this.props.navigator.push('Profile')
```

### setInterceptor

`setInterceptor((action, from, to, extras) => {})` 拦截 `dispatch` 的操作，可以插入一些横切面逻辑。

```js
Navigator.setInterceptor((action, from, to, extras) => {
  console.info(`action:${action} from:${from} to:${to}`)
  // 当返回 true 时，表示你要拦截该操作
  // 譬如用户想要跳到的页面需要登录，你可以在这里验证用户是否已经登录，否则就重定向到登录页面
  return false
})
```

`extras` 中有我们需要的额外信息。譬如 `sceneId`，它表示动作发出的页面， 通过 `Navigator.of(sceneId)` 可以获取该页面的 `navigator`。如果 action 是 switchTab，我们还可以从 `extras` 中获取 `index` 这个属性，它表示将要切换到的 tab 的位置，从 0 开始。

### of

`of(sceneId): Navigator` 接受 `sceneId` 作为参数，返回一个已经存在的 `Navigator` 实例

```js
this.props.navigator === Navigator.of(this.props.sceneId)
// true
```

### find

`find(moduleName): Promise<Navigator>` 接受 `moduleName` 作为参数，返回一个已经存在的 `Navigator` 实例

有时候，你想知道某个页面存不存在，这个方法就很方便了。

### current

`current(): Promise<Navigator>` 返回当前有效的 navigator，通常是用户当前可见的那个页面的 navigator

```js
const navigator = await Navigator.current()
this.props.navigator === navigator
// true
```

### currentRoute

`currentRoute(): Promise<Route>` 获取当前路由信息

```js
import { Navigator } from 'hybrid-navigation'

const route = await Navigator.currentRoute()

// {
//   sceneId: 'xxxxxxxx',
//   moduleName: 'Name'
//   mode: 'modal'
// }

const navigator = Navigator.of(route.sceneId)
```

以上操作等同于

```js
const navigator = await Navigator.current()
```

### routeGraph

`routeGraph(): Promise<RouteGraph[]>` 有时，我们不光需要知道当前正处于哪个页面，还需要知道当前整个 UI 层级或者说路由图

```js
import { Navigator } from 'hybrid-navigation';

const graph = await Navigator.routeGraph();
console.info(graph);

const sceneId = // 通过 graph 抽取出我们想要的 sceneId

const navigator = Navigator.of(sceneId);
```

`graph` 是一个数组，它长下面这个样子

```js
;[
  {
    layout: 'drawer',
    sceneId: '',
    children: [], // 又是一个 graph 数组
    mode: '', // modal, nornal, present，表示该页面是通过 prensent、showModal 或者其它方式显示
  },

  {
    layout: 'tabs',
    sceneId: '',
    children: [],
    mode: '',
    state: { selectedIndex: 1 },
  },

  {
    layout: 'stack',
    sceneId: '',
    children: [],
    mode: '',
  },

  {
    layout: 'screen',
    sceneId: '36d60707-354e-4f87-a790-20590261500b',
    moduleName: 'Navigation',
    mode: '', // modal, present, normal
  },
]
```

`Navigator.routeGraph` 帮助我们获得整张路由图，它是实现 DeepLink 的基础。本库已经提供了 [DeepLink](./deeplink.md) 的默认实现。

下面，我们开始介绍实例方法：

## Screen

screen 是最基本的页面，它用来表示通过 `ReactRegistry.registerComponent` 注册的组件。它有一些基本的导航能力，所有容器均继承了这些能力。

### present

`present(moduleName, prop, options): Promise<[number, Result]>` 是一种模态交互方式，类似于 Android 的 `startActivityForResult`，要求被 present 的页面返回结果给发起 present 的页面。在 iOS 中，present 表现为从底往上弹出界面。

比如 A 页面 `present` 出 B 页面

```js
// A.js
navigator.present('B')
```

B 页面通过 `setResult`返回结果给 A 页面

```js
// B.js
navigator.setResult(RESULT_OK, { text: 'greeting' })
navigator.dismiss()
```

**注意：仅支持返回可以序列化为 json 的对象，不支持函数**

A 页面通过实现 `async-await` 的方式来接收结果

```js
// A.js
const [resultCode, data] = await navigator.present('B')
if (resultCode === RESULT_OK) {
  this.setState({ text: data.text || '', error: undefined })
}
```

A 在 present B 时，可以通过第二个参数传值给 B

```js
// A.js
navigator.present('B', {})
```

B 页面可以通过 `props` 来获取传递的值

::: warning

**第二个参数仅支持可以序列化为 json 的对象，不支持函数**

:::

有些时候，比如选择一张照片，我们先要跳到相册列表页面，然后进入某个相册选择相片返回。这也是没有问题的。

A 页面 `present` 出相册列表页面

```javascript
//A.js
navigator.present('AlbumList')
```

相册列表页面 `push` 到某个相册

```javascript
// AlbumList.js
navigator.push('Album')
```

在相册页面选好相片后返回结果给 A 页面

```javascript
// Album.js
navigator.setResult(RESULT_OK, { uri: 'file://...' })
navigator.dismiss()
```

A 页面通过实现 `async-await` 的方式来接收结果（略）。

### presentLayout

`presentLayout(layout: Layout): Promise<[number, Result]>` present 的加强版，通过传递一个布局对象，用来 present UI 层级比较复杂的页面，同样使用 dismiss 来关闭。

```js
// A.js
navigator.presentLayout(
  {
    stack: {
      children: { screen: { moduleName: 'B' } },
    },
  },
  REQUEST_CODE,
)
```

以上效果实际等同于：

```js
// A.js
navigator.present('B')
```

也就是说，present 出来的组件，默认会嵌套在 stack 里面，因为当使用 present 时，把目标页面嵌套在 stack

### setResult

`setResult(resultCode, data)` 设置返回结果。结果会延迟到页面关闭时传递，因此在页面关闭之前，可以多次调用，以最后一次调用为准。

在调用 `dismiss`、`hideModal`、`pop` 等关闭页面的方法后，结果会被传递到目标页面。

### dismiss

`dismiss()` 关闭 `present` 出来的页面，如果该页面是容器，可以在容器的任何子页面调用此方法。

::: warning
**在调用 `navigator.dismiss` 后，该 navigator 将会失效，不要再使用该 navigator 执行任何导航操作。**
:::

### showModal

`showModal(moduleName, props, options): Promise<[number, Result]>`

将 React.Component 作为 Modal 显示，用来取代官方的 `Modal` 组件，比较适合做透明弹窗。

`showModal` 的底层实现和 present 基本相同。类似于 iOS 上 `UIModalPresentationOverFullScreen` 和 `UIModalPresentationCurrentContext` 的区别。

```javascript
navigator.showModal('ReactModal')
```

可以通过第二个参数来给 modal 传递属性：

```javascript
navigator.showModal('ReactModal', { x: '123' })
```

modal 通过 `props` 来获取传递过来的属性

modal 在关闭前通过以下方式设置返回值：

```js
navigator.setResult(resultCode, data)
navigator.hideModal()
```

目标页面（即将 modal 显示出来的页面）可以通过 `async-await` 的方式来接收结果：

```js
const [resultCode, data] = await navigator.showModal('ReactModal')
```

::: warning
如果遭遇到 Android 生命周期噩梦，请使用 `React.Context` 或 `Redux` 等方案来获取结果。
:::

### showModalLayout

`showModalLayout<T>(layout: Layout): Promise<[number, T]>` showModal 的加强版，可以将布局对象作为 Modal 显示，同样使用 hideModal 来关闭。

### hideModal

`hideModal()` 隐藏作为 Modal 显示的页面，如果 Modal 是一个容器，可以在该容器的任何子页面调用此方法。

::: warning
**在调用 `navigator.hideModal` 后，该 navigator 将会失效，不要再使用该 navigator 执行任何导航操作。**
:::

## Stack

stack 以栈的方式管理它的子页面，它支持 `push`、`pop` 等操作。

### push

`push(moduleName, props, options): Promise<[number, Result]>` 打开一个新的页面，等同于 iOS 的 push 操作。

由 A 页面跳转到 B 页面。

```js
// A.js
navigator.push('B')
```

可以通过第二个参数来传值给 B 页面，B 页面通过 `props` 来访问传递过来的值。

```js
// A.js
navigator.push('B', {...});
```

::: warning
第二个参数只支持可以序列化为 json 的对象，不支持函数
:::

### pushLayout

`pushLayout(layout: Layout): Promise<[number, Result]>` push 加强版，通过传递一个布局对象，展示 UI 层级比较复杂的页面。

### pop

`pop()` 返回到前一个页面。比如你由 A 页面 `push` 到 B 页面，现在想返回到 A 页面。

```js
// B.js
navigator.pop()
```

### popTo

`popTo(moduleName: string)` 返回到之前的指定页面。比如你由 A 页面 `push` 到 B 页面，由 B 页面 `push` 到 C 页面，由 C 页面 `push` 到 D 页面，现在想返回 B 页面，只需要 `popTo('B')` 即可

从 B 页面跳到 C 页面

```js
// B.js
navigator.push('C')
```

从 C 页面跳到 D 页面

```js
// C.js
navigator.push('D')
```

现在想从 D 页面返回到 B 页面

```js
// D.js
navigator.popTo('B')
```

### popToRoot

`popToRoot()` 返回到 Stack 根页面。比如 A 页面是根页面，由 A 页面 `push` 到 B 页面，由 B 页面 `push` 到 C 页面，由 C 页面 `push` 到 D 页面，现在想返回到根部，也就是 A 页面：

```js
// D.js
navigator.popToRoot()
```

`pop`, `popTo`, `popToRoot` 也可以通过 `navigator.setResult(RESULT_OK, {...})`返回结果给目标页面，目标页面通过 `async-await` 来接收结果。

### redirectTo

`redirectTo(moduleNamstring, props, options): void` 用指定页面取代当前页面，比如当前页面是 A，想要替换成 B

```js
// A.js
navigator.redirectTo('B')
```

现在 stack 里没有 A 页面了，被替换成了 B。

又比如 stack 里有 A, B, C 三个页面，现在想要让 B, C 出栈，并且让 D 入栈

找到 B 页面的 navigator，调用 `navigator.redirectTo('D')` 方法即可

```js
// C.js
const navigator = await Navigator.find('B')
navigator.redirectTo('D')
```

现在 stack 里有 A, D 两个页面。

### isStackRoot

`isStackRoot(): Promise<boolean>` 判断一个页面是否所在 stack 的根页面，返回值是一个 Promise.

```js
componentDidMount() {
  navigator.isStackRoot().then((isRoot) => {
    if(isRoot) {
      garden.setLeftBarButtonItem({title: '取消', action: 'cancel'});
      this.setState({isRoot});
    }
  })
}
```

### setParams

`setParams(params)` 存放和该 navigator 相关的属性或状态，可以通过 `navigator.state.params` 取出，具体应用参考 [example/TopBarTitleView](https://github.com/listenzz/hybrid-navigation/blob/master/example/src/TopBarTitleView.js) 这个例子。

## Tabs

tabs 支持以下导航操作

### switchTab

`switchTab(index, popToRoot = false)` 切换到指定 Tab

```js
navigator.switchTab(1)
```

该方法还接受第二个参数，是个布尔值，用来控制在切换到其它 Tab 时，当前 Tab (该 Tab 是个 Stack) 要不要重置到根页面，默认是 false.

```javascript
// 当前 Tab 会调用 popToRoot
navigator.switchTab(1, true)
```

## Drawer

drawer 支持以下导航操作

### toggleMenu

`toggleMenu()` 切换抽屉的开关状态

```js
navigator.toggleMenu()
```

### openMenu

`openMenu()` 打开抽屉

```js
navigator.openMenu()
```

### closeMenu

`closeMenu()` 关闭抽屉

```js
navigator.closeMenu()
```

## 注意事项

- **永远不可能 pesent 一个页面在 modal 之上**

  譬如 A 是个 modal，那么不可能在它上面执行 `navigator.present` 操作。

  譬如 A 是个普通页面(非 modal)，它通过 `navigator.showModal` 显示 B，那么在 B 被关闭前，A 不能通过 `navigator.present` 显示 C。

- **如果一个页面已经 present 出一个页面，那么在该页面未关闭之前，它不能再 present 出另一个页面。**

  譬如 A 是个普通页面(非 modal)，它通过 `navigator.present` 显示 B，那么在 B 被关闭前，A 不能通过 `navigator.present` 显示 C。

- **如果一个页面已经 show 出一个 modal，那么在该 modal 未关闭之前，它不能再 show 出另一个 modal。**

  譬如 A (可以是 modal)，它通过 `navigator.showModal` 显示 B，那么在 B 被关闭前，A 不能通过 `navigator.showModal` 显示 C。

- **在调用 `dismiss` 、`hideModal`、`pop`、`popTo`、`popToRoot` 或者 `redirectTo` 后，该 navigator 将会失效，不要再使用该 navigator 执行任何导航操作。**

  ```javascript
  navigator.hideModal()
  // 下面这行代码不会生效
  navigator.present('XXX')
  ```

  一个变通的办法是使用 `Navigator.current`

  ```javascript
  navigator.hideModal()
  // 使用 modal 隐藏后出现的页面的 navigator
  const currrent = await Navigator.currrent()
  currrent.present('XXX')
  ```

- 如果由于某些原因，需要**在页面之外**执行导航操作，可以使用 `router`，它会自动获取合适的 navigator 来执行操作，必要时关闭一些页面。

  ```js
  router.open('/path/to/Foo')
  ```

  使用 router，在通过 `ReactRegistry.registerComponent` 注册模块时，需要传递第三个参数，详情请查看[路由注册](./deeplink.md#注册)

  如果需要从第三方应用(譬如浏览器)打开 App 指定页面，则需要使用 [DeepLink](./deeplink.md)。

  > 在应用内使用 `router.open` 并不需要激活 DeepLink，也不需要配置 schema
