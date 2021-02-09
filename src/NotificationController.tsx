import React, { ComponentType } from 'react'
import NotificationComponentProps from './types/NotificationComponent'
import TransitionState from './types/TransitionState'
import useTimeout from './useTimeout'

interface NotificationControllerProps<ContentType> {
  autoDismiss: boolean
  autoDismissTimeout: number
  onDismiss: () => void
  component: ComponentType<NotificationComponentProps<ContentType>>
  content: ContentType
  transitionDuration?: number
  transitionState: TransitionState
}

const NotificationController = function NotificationController<ContentType>({
  autoDismiss,
  autoDismissTimeout,
  onDismiss,
  component: Notification,
  content,
  ...notificationProps
}: NotificationControllerProps<ContentType>) {
  useTimeout(autoDismiss ? onDismiss : () => null, autoDismissTimeout)

  return (
    <Notification
      onDismiss={onDismiss}
      content={content}
      {...notificationProps}
    />
  )
}

export default NotificationController
