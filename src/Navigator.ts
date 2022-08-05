import {
  EventEmitter,
  NavigationModule,
  EVENT_WILL_SET_ROOT,
  EVENT_DID_SET_ROOT,
  EVENT_SWITCH_TAB,
  KEY_SCENE_ID,
  KEY_INDEX,
  RESULT_CANCEL,
  EVENT_NAVIGATION,
  KEY_ON,
  ON_COMPONENT_RESULT,
  KEY_REQUEST_CODE,
  KEY_RESULT_CODE,
  KEY_RESULT_DATA,
} from './NavigationModule'
import { bindBarButtonItemClickEvent } from './utils'
import store from './store'
import { RouteGraph, Route } from './router'
import { Visibility } from './hooks'
import {
  IndexType,
  ResultType,
  NavigationInterceptor,
  Layout,
  BuildInLayout,
  NavigationItem,
  PropsType,
} from './typing'
import { Garden } from './Garden'

interface Params {
  animated?: boolean
  moduleName?: string
  layout?: BuildInLayout | Layout
  popToRoot?: boolean
  requestCode?: number
  props?: IndexType
  options?: NavigationItem
  [index: string]: any
}

interface NavigationState {
  params: { readonly [index: string]: any }
}

let interceptor: NavigationInterceptor
let shouldCallWillSetRootCallback = 0
let willSetRootCallback: () => void
let didSetRootCallback: () => void
let tag = 0

EventEmitter.addListener(EVENT_DID_SET_ROOT, _ => {
  didSetRootCallback && didSetRootCallback()
  shouldCallWillSetRootCallback = 0
})

EventEmitter.addListener(EVENT_WILL_SET_ROOT, _ => {
  if (shouldCallWillSetRootCallback === 0 && willSetRootCallback) {
    willSetRootCallback()
  }
})

EventEmitter.addListener(EVENT_SWITCH_TAB, event => {
  const index = event[KEY_INDEX]
  const [from, to] = index.split('-')
  Navigator.dispatch(event[KEY_SCENE_ID], 'switchTab', {
    from: Number(from),
    to: Number(to),
  })
})

interface ResultListener<T extends ResultType> {
  (resultCode: number, data: T): void
  cancel: () => void
  sceneId: string
}

const resultListeners = new Map<number, ResultListener<any>>()

EventEmitter.addListener(EVENT_NAVIGATION, data => {
  if (data[KEY_ON] === ON_COMPONENT_RESULT) {
    const requestCode = data[KEY_REQUEST_CODE]
    const resultCode = data[KEY_RESULT_CODE]
    const resultData = data[KEY_RESULT_DATA]
    const sceneId = data[KEY_SCENE_ID]

    if (requestCode < 0) {
      const listener = resultListeners.get(requestCode)
      if (listener) {
        resultListeners.delete(requestCode)
        listener(resultCode, resultData)
      }
    } else {
      const navigator = Navigator.of(sceneId)
      navigator.result(resultCode, resultData)
    }
  }
})

export class Navigator {
  static of(sceneId: string) {
    let navigator = store.getNavigator(sceneId)
    if (!navigator) {
      navigator = new Navigator(sceneId)
      store.addNavigator(sceneId, navigator)
    }
    return navigator
  }

  static async find(moduleName: string) {
    const sceneId = await new Promise<string>((resolve, reject) => {
      NavigationModule.findSceneIdByModuleName(moduleName, (error: never, id: string) => {
        if (error) {
          reject(error)
        } else {
          resolve(id)
        }
      })
    })

    if (sceneId) {
      return Navigator.of(sceneId)
    }
  }

  static async current(): Promise<Navigator> {
    const route = await Navigator.currentRoute()
    return Navigator.of(route.sceneId)
  }

  static currentRoute(): Promise<Route> {
    return new Promise<Route>((resolve, reject) => {
      NavigationModule.currentRoute((error: never, route: Route) => {
        if (error) {
          reject(error)
        } else {
          resolve(route)
        }
      })
    })
  }

  static routeGraph(): Promise<RouteGraph[]> {
    return new Promise<RouteGraph[]>((resolve, reject) => {
      NavigationModule.routeGraph((error: never, result: RouteGraph[]) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  static setRoot(layout: BuildInLayout | Layout, sticky = false) {
    const pureLayout = bindBarButtonItemClickEvent(layout, {
      inLayout: true,
      navigatorFactory: (sceneId: string) => {
        return Navigator.of(sceneId)
      },
    })
    if (willSetRootCallback) {
      shouldCallWillSetRootCallback++
      willSetRootCallback()
    }

    const flag = --tag
    NavigationModule.setRoot(pureLayout, sticky, flag)

    return new Promise<void>(resolve => {
      const subscription = EventEmitter.addListener(EVENT_DID_SET_ROOT, (data: { tag: number }) => {
        if (data.tag === flag) {
          subscription.remove()
          resolve()
        }
      })
    })
  }

  static setRootLayoutUpdateListener(willSetRoot = () => {}, didSetRoot = () => {}) {
    willSetRootCallback = willSetRoot
    didSetRootCallback = didSetRoot
  }

  static async dispatch(sceneId: string, action: string, params: Params = {}): Promise<boolean> {
    let intercepted = false
    const { from, to } = params
    if (interceptor) {
      const result = interceptor(action, {
        sceneId,
        from,
        to,
      })
      if (result instanceof Promise) {
        intercepted = await result
      } else {
        intercepted = result
      }
    }

    if (!intercepted) {
      return new Promise<boolean>((resolve, reject) => {
        NavigationModule.dispatch(sceneId, action, params, (error: never, result: boolean) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        })
      })
    }

    return false
  }

  static setInterceptor(interceptFn: NavigationInterceptor) {
    interceptor = interceptFn
  }

  constructor(public sceneId: string, public moduleName?: string) {}

  visibility: Visibility = 'pending'

  readonly state: NavigationState = {
    params: {},
  }

  setParams = (params: { [index: string]: any }) => {
    this.state.params = { ...this.state.params, ...params }
  }

  dispatch = (action: string, params: Params = {}) => {
    return Navigator.dispatch(this.sceneId, action, {
      from: this.moduleName,
      to: params.moduleName,
      ...params,
    })
  }

  result = (resultCode: number, data: ResultType) => {
    if (this.resultListener) {
      this.resultListener(resultCode, data)
      this.resultListener = null
    }
  }

  unmount = () => {
    const codes: number[] = []
    for (const [requestCode, listener] of resultListeners) {
      if (listener.sceneId === this.sceneId) {
        codes.push(requestCode)
        listener.cancel()
      }
    }
    codes.forEach(code => resultListeners.delete(code))

    if (this.resultListener) {
      this.resultListener.cancel()
      this.resultListener = null
    }
  }

  private _garden?: Garden

  get garden() {
    if (!this._garden) {
      this._garden = new Garden(this.sceneId)
    }
    return this._garden
  }

  private resultListener: ResultListener<any> | null = null

  private waitResult<T extends ResultType>(requestCode: number, successful: boolean): Promise<[number, T]> {
    if (!successful) {
      return Promise.resolve([RESULT_CANCEL, null as any])
    }

    if (this.resultListener) {
      this.resultListener.cancel()
      this.resultListener = null
    }

    return new Promise<[number, T]>(resolve => {
      const listener = (resultCode: number, data: T) => {
        resolve([resultCode, data])
      }

      listener.cancel = () => {
        resolve([RESULT_CANCEL, null as any])
      }

      listener.sceneId = this.sceneId

      if (requestCode < 0) {
        resultListeners.set(requestCode, listener)
      } else {
        this.resultListener = listener
      }
    })
  }

  push = async <T extends ResultType, P extends PropsType = PropsType>(
    moduleName: string,
    props: P = {} as any,
    options: NavigationItem = {},
  ) => {
    const success = await this.dispatch('push', { moduleName, props, options })
    return await this.waitResult<T>(0, success)
  }

  pushLayout = async <T extends ResultType>(layout: BuildInLayout | Layout) => {
    const success = await this.dispatch('pushLayout', { layout })
    return await this.waitResult<T>(0, success)
  }

  pop = () => {
    return this.dispatch('pop')
  }

  popTo = (moduleName: string, inclusive: boolean = false) => {
    return this.dispatch('popTo', { moduleName, inclusive })
  }

  popToRoot = () => {
    return this.dispatch('popToRoot')
  }

  redirectTo = <P extends PropsType = PropsType>(
    moduleName: string,
    props: P = {} as any,
    options: NavigationItem = {},
  ) => {
    return this.dispatch('redirectTo', {
      moduleName,
      props,
      options,
    })
  }

  isStackRoot = () => {
    return new Promise<boolean>((resolve, reject) => {
      NavigationModule.isStackRoot(this.sceneId, (error: never, result: boolean) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  present = async <T extends ResultType, P extends PropsType = PropsType>(
    moduleName: string,
    props: P = {} as any,
    options: NavigationItem = {},
  ) => {
    const requestCode = --tag
    const success = await this.dispatch('present', {
      moduleName,
      props,
      options,
      requestCode,
    })
    return await this.waitResult<T>(requestCode, success)
  }

  presentLayout = async <T extends ResultType>(layout: BuildInLayout | Layout) => {
    const requestCode = --tag
    const success = await this.dispatch('presentLayout', { layout, requestCode })
    return await this.waitResult<T>(requestCode, success)
  }

  dismiss = () => {
    return this.dispatch('dismiss')
  }

  showModal = async <T extends ResultType, P extends PropsType = PropsType>(
    moduleName: string,
    props: P = {} as any,
    options: NavigationItem = {},
  ) => {
    const requestCode = --tag
    const success = await this.dispatch('showModal', {
      moduleName,
      props,
      options,
      requestCode,
    })
    return await this.waitResult<T>(requestCode, success)
  }

  showModalLayout = async <T extends ResultType>(layout: BuildInLayout | Layout) => {
    const requestCode = --tag
    const success = await this.dispatch('showModalLayout', { layout, requestCode })
    return await this.waitResult<T>(requestCode, success)
  }

  hideModal = () => {
    return this.dispatch('hideModal')
  }

  setResult = <T extends ResultType>(resultCode: number, data: T = null as any): void => {
    NavigationModule.setResult(this.sceneId, resultCode, data)
  }

  switchTab = async (index: number, popToRoot: boolean = false) => {
    const from = await new Promise<number>((resolve, reject) => {
      NavigationModule.currentTab(this.sceneId, (error: never, result: number) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
    return this.dispatch('switchTab', { from, to: index, popToRoot })
  }

  toggleMenu = () => {
    return this.dispatch('toggleMenu')
  }

  openMenu = () => {
    return this.dispatch('openMenu')
  }

  closeMenu = () => {
    return this.dispatch('closeMenu')
  }

  signalFirstRenderComplete = () => {
    NavigationModule.signalFirstRenderComplete(this.sceneId)
  }
}
