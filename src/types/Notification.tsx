import TransitionState from './TransitionState'

export interface Options {
  id?: string
  transitionDuration?: number
  transitionState?: TransitionState
}

export type DefaultContentType = Node | string
export default interface Notification<ContentType> extends Options {
  id: string
  content: ContentType
  options?: Options
}
