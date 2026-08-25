import {
    NotificationI18nTextObject, NotificationObject, MyNotificationsResponseData 
} from "./response"
describe("my notifications response DTOs",
    () => { it("preserves i18n params and unread state",
        () => { const title = Object.assign(new NotificationI18nTextObject(),
            {
                key: "notification.test", params: {
                    actor: "Alice" 
                } 
            }); const notification = Object.assign(new NotificationObject(),
            {
                id: "n1", type: "NewFollower", title, body: null, isRead: false, target: null, readAt: null, createdAt: new Date() 
            }); const data = Object.assign(new MyNotificationsResponseData(),
            {
                items: [notification], total: 1, unreadCount: 1 
            }); expect(data).toMatchObject({
            items: [{
                title: {
                    key: "notification.test", params: {
                        actor: "Alice" 
                    } 
                }, isRead: false, target: null 
            }], unreadCount: 1 
        }) }) })
