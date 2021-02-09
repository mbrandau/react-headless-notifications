import React, { ComponentType, ReactNode, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { Transition, TransitionGroup } from 'react-transition-group'
import NotificationController from './NotificationController'
import Notification, { DefaultContentType, Options } from './types/Notification'
import NotificationComponentProps from './types/NotificationComponent'
import TransitionState from './types/TransitionState'

type Id = string
type AddFn<ContentType> = (content: ContentType, options?: Options) => Id | null
type RemoveFn = (id: Id) => void

interface Context<ContentType> {
  add: AddFn<ContentType>
  remove: RemoveFn
  removeAll: () => void
  notifications: Array<Notification<ContentType>>
}

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

function generateUEID(): string {
  const first = ('000' + ((Math.random() * 46656) | 0).toString(36)).slice(-3)
  const second = ('000' + ((Math.random() * 46656) | 0).toString(36)).slice(-3)
  return first + second
}

interface NotificationProviderProps<ContentType> {
  autoDismissTimeout?: number
  autoDismiss?: boolean
  children?: ReactNode
  transitionDuration?: number
  containerComponent: ComponentType
  notificationComponent: ComponentType<NotificationComponentProps<ContentType>>
}

interface NotificationConsumerProps<ContentType> {
  children: (context: Context<ContentType>) => ReactNode
}

export function createContext<ContentType = DefaultContentType>() {
  const ctx = React.createContext<Context<ContentType>>({
    add: () => '',
    remove: () => null,
    removeAll: () => null,
    notifications: []
  })

  return {
    Provider: function ({
      autoDismissTimeout = 5000,
      autoDismiss = true,
      children,
      containerComponent: ContainerComponent,
      notificationComponent: NotificationComponent,
      transitionDuration = 200
    }: NotificationProviderProps<ContentType>) {
      const [notifications, setNotifications] = useState<
        Array<Notification<ContentType>>
      >([])

      const has = (id: Id): boolean => {
        if (!notifications.length) return false
        return Boolean(notifications.filter((t) => t.id === id).length)
      }

      const add = (content: ContentType, options: Options = {}): Id | null => {
        const id = options.id || generateUEID()

        // bail if a notification exists with this ID
        if (has(id)) return null

        // update the notification stack
        setNotifications([...notifications, { content, id, ...options }])

        // consumer may want to do something with the generated ID (and not use the callback)
        return id
      }

      const remove = (id: Id): void => {
        setNotifications(notifications.filter((t) => t.id !== id))
      }

      const removeAll = (): void => {
        if (!notifications.length) return
        notifications.forEach((t) => remove(t.id))
      }

      const onDismiss = (id: Id) => (): void => {
        remove(id)
      }

      const portalTarget = canUseDOM ? document.body : null

      return (
        <ctx.Provider value={{ add, remove, removeAll, notifications }}>
          {children}

          {portalTarget ? (
            createPortal(
              <ContainerComponent>
                <TransitionGroup component={null}>
                  {notifications.map(({ content, id }) => (
                    <Transition
                      appear
                      key={id}
                      mountOnEnter
                      timeout={transitionDuration}
                      unmountOnExit
                    >
                      {(transitionState: TransitionState) => (
                        <NotificationController<ContentType>
                          autoDismiss={autoDismiss}
                          autoDismissTimeout={autoDismissTimeout}
                          key={id}
                          onDismiss={onDismiss(id)}
                          transitionDuration={transitionDuration}
                          transitionState={transitionState}
                          component={NotificationComponent}
                          content={content}
                        />
                      )}
                    </Transition>
                  ))}
                </TransitionGroup>
              </ContainerComponent>,
              portalTarget
            )
          ) : (
            <ContainerComponent /> // keep ReactDOM.hydrate happy
          )}
        </ctx.Provider>
      )
    },
    Consumer: ({ children }: NotificationConsumerProps<ContentType>) => (
      <ctx.Consumer>{(context) => children(context)}</ctx.Consumer>
    ),
    useNotifications: () => {
      const context = useContext(ctx)

      if (!context) {
        throw Error(
          'The `useNotifications` hook must be called from a descendent of the `NotificationProvider`.'
        )
      }

      return {
        addNotification: context.add,
        removeNotification: context.remove,
        removeAllNotifications: context.removeAll,
        notificationStack: context.notifications
      }
    }
  }
}
