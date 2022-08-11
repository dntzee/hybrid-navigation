import { NativeEventEmitter, NativeModules, Platform } from 'react-native'
import { bindBarButtonItemClickEvent } from './utils'
import { NavigationOption, ImageSource, Color, BarStyle, TitleAlignment, BarButtonItem, TitleItem } from './typing'

export interface ShadowImage {
  image?: ImageSource
  color?: Color
}

export interface Style {
  screenBackgroundColor?: Color // 页面背景，默认是白色
  topBarStyle?: BarStyle // TopBar 样式，决定了状态栏的颜色，可选项有 `BarStyleLightContent` 和 `BarStyleDarkContent`
  topBarColor?: Color // TopBar 背景颜色，默认根据 topBarStyle 来计算
  topBarColorDarkContent?: Color // TopBar 背景颜色，当 topBarStyle 的值为 BarStyleDarkContent 时生效，覆盖 topBarColor 的值
  topBarColorLightContent?: Color // TopBar 背景颜色，当 topBarStyle 的值为 BarStyleLightContent 时生效，覆盖 topBarColor 的值
  statusBarColorAndroid?: Color // 状态栏背景颜色，默认取 topBarColor 的值
  navigationBarColorAndroid?: Color // 底部虚拟键背景颜色，仅对 Android 8.0 以上版本生效
  hideBackTitleIOS?: boolean // 是否隐藏返回按钮旁边的文字，默认是 false, 仅对 iOS 生效
  elevationAndroid?: number // TopBar 阴影高度，默认值为 4 dp
  shadowImage?: ShadowImage // TopBar 阴影图片，仅对 iOS 生效
  backIcon?: ImageSource // 返回按钮图片
  topBarTintColor?: Color // TopBar 按钮的颜色。默认根据 topBarStyle 来计算
  topBarTintColorDarkContent?: Color // TopBar 按钮颜色，当 topBarStyle 的值为 BarStyleDarkContent 时生效，覆盖 topBarTintColor 的值
  topBarTintColorLightContent?: Color // TopBar 按钮颜色，当 topBarStyle 的值为 BarStyleLightContent 时生效，覆盖 topBarTintColor 的值
  titleTextColor?: Color // TopBar 标题颜色，默认根据 topBarStyle 来计算
  titleTextColorDarkContent?: Color // TopBar 标题颜色，当 topBarStyle 的值为 BarStyleDarkContent 时生效，覆盖 titleTextColor 的值
  titleTextColorLightContent?: Color // TopBar 标题颜色，当 topBarStyle 的值为 BarStyleLightContent 时生效，覆盖 titleTextColor 的值
  titleTextSize?: number // TopBar 标题字体大小，默认是 17 dp(pt)
  titleAlignmentAndroid?: TitleAlignment // TopBar 标题的位置，可选项有 `TitleAlignmentLeft` 和 `TitleAlignmentCenter` ，仅对 Android 生效
  barButtonItemTextSize?: number // TopBar 按钮字体大小，默认是 15 dp(pt)
  swipeBackEnabledAndroid?: boolean // Android 是否开启右滑返回，默认是 false
  splitTopBarTransitionIOS?: boolean // iOS 侧滑返回时，是否总是割裂导航栏背景
  scrimAlphaAndroid?: number // Android 侧滑返回遮罩效果 [0 - 255]
  displayCutoutWhenLandscapeAndroid?: boolean // 横屏时，是否将界面延伸至刘海区域，默认 true

  tabBarColor?: Color // 底部 TabBar 背景颜色，请勿使用带透明度的颜色。
  tabBarShadowImage?: ShadowImage // 底部 TabBar 阴影图片。对于 iOS, 只有同时设置了 tabBarColor 才会生效
  tabBarItemColor?: Color // 底部 TabBarItem icon 选中颜色
  tabBarUnselectedItemColor?: Color // 底部 TabBarItem icon 未选中颜色，默认为 #BDBDBD
  tabBarBadgeColor?: Color //  Tab badge 颜色
}

export type TabBarStyle = Pick<
  Style,
  'tabBarColor' | 'tabBarShadowImage' | 'tabBarItemColor' | 'tabBarUnselectedItemColor'
>

export interface TabBadge {
  index: number
  text?: string
  hidden: boolean
  dot?: boolean
}

export interface TabItemInfo {
  index: number
  title?: string
  badge?: {
    text?: string
    hidden: boolean
    dot?: boolean
  }
  icon?: {
    selected: ImageSource
    unselected?: ImageSource
  }
}

export interface TabIcon {
  index: number
  icon: ImageSource
  unselectedIcon?: ImageSource
}

type Nullable<T> = {
  [P in keyof T]: T[P] extends T[P] | undefined ? T[P] | null : T[P]
}

const GardenModule = NativeModules.GardenModule
const { STATUSBAR_HEIGHT, EVENT_STATUSBAR_FRAME_CHANGE, TOOLBAR_HEIGHT } = GardenModule.getConstants()

if (Platform.OS === 'ios') {
  const GardenEventEmitter: NativeEventEmitter = new NativeEventEmitter(GardenModule)
  GardenEventEmitter.addListener(EVENT_STATUSBAR_FRAME_CHANGE, ({ statusBarHeight }) => {
    Garden.statusBarHeight = statusBarHeight
    Garden.topBarHeight = statusBarHeight + TOOLBAR_HEIGHT
  })
}

export class Garden {
  static setStyle(style: Style = {}) {
    GardenModule.setStyle(style)
  }

  static statusBarHeight: number = STATUSBAR_HEIGHT
  static toolbarHeight: number = TOOLBAR_HEIGHT
  static topBarHeight: number = TOOLBAR_HEIGHT + STATUSBAR_HEIGHT

  constructor(public sceneId: string) {}

  // --------------- instance method --------------

  setLeftBarButtonItem(buttonItem: Nullable<BarButtonItem> | null) {
    const options = bindBarButtonItemClickEvent(buttonItem, { sceneId: this.sceneId })
    GardenModule.setLeftBarButtonItem(this.sceneId, options)
  }

  setRightBarButtonItem(buttonItem: Nullable<BarButtonItem> | null) {
    const options = bindBarButtonItemClickEvent(buttonItem, { sceneId: this.sceneId })
    GardenModule.setRightBarButtonItem(this.sceneId, options)
  }

  setLeftBarButtonItems(buttonItems: Array<Nullable<BarButtonItem>> | null) {
    const options = bindBarButtonItemClickEvent(buttonItems, { sceneId: this.sceneId })
    GardenModule.setLeftBarButtonItems(this.sceneId, options)
  }

  setRightBarButtonItems(buttonItems: Array<Nullable<BarButtonItem>> | null) {
    const options = bindBarButtonItemClickEvent(buttonItems, { sceneId: this.sceneId })
    GardenModule.setRightBarButtonItems(this.sceneId, options)
  }

  setTitleItem(titleItem: TitleItem) {
    GardenModule.setTitleItem(this.sceneId, titleItem)
  }

  updateOptions(options: NavigationOption) {
    GardenModule.updateOptions(this.sceneId, options)
  }

  updateTabBar(options: TabBarStyle) {
    GardenModule.updateTabBar(this.sceneId, options)
  }

  setTabItem(item: TabItemInfo | TabItemInfo[]) {
    if (!Array.isArray(item)) {
      item = [item]
    }
    GardenModule.setTabItem(this.sceneId, item)
  }

  setTabIcon(icon: TabIcon | TabIcon[]) {
    console.warn(`Garden#setTabIcon is deprecated, use Garden#setTabItem instead.`)
    if (!Array.isArray(icon)) {
      icon = [icon]
    }
    const icons = icon
    const items: Array<TabItemInfo> = []
    for (const i of icons) {
      items.push({
        index: i.index,
        icon: {
          selected: i.icon,
          unselected: i.unselectedIcon,
        },
      })
    }
    this.setTabItem(items)
  }

  setTabBadge(badge: TabBadge | TabBadge[]) {
    console.warn(`Garden#setTabBadge is deprecated, use Garden#setTabItem instead.`)
    if (!Array.isArray(badge)) {
      badge = [badge]
    }

    const badges = badge
    const items: Array<TabItemInfo> = []
    for (const b of badges) {
      items.push({
        index: b.index,
        badge: {
          hidden: b.hidden,
          text: b.text,
          dot: b.dot,
        },
      })
    }
    this.setTabItem(items)
  }

  setMenuInteractive(enabled: boolean) {
    GardenModule.setMenuInteractive(this.sceneId, enabled)
  }
}
