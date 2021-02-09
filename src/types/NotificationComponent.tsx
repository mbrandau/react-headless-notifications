import TransitionState from './TransitionState'

interface NotificationComponentProps<ContentType> {
  onDismiss?: () => void
  content: ContentType
  transitionState: TransitionState
  transitionDuration?: number
}

export default NotificationComponentProps
