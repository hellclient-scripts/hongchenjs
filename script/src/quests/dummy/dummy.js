$.Module(function (App) {
    let Dummy = {}
    Dummy.WaitDuration = 60 * 1000
    Dummy.CheckKey = function () {
        if (App.Data.Item.List.FindByID("key").First() == null) {
            Dummy.AskKey()
            return
        }
        Dummy.Wait()
    }
    //杰二修(Jarlyynb)告诉你：key 123
    let matcheraskkey = /^([^：()\[\]]{2,5})\((.+)\)告诉你：key (.+)$/
    let PlanWait = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTimer(Dummy.WaitDuration, () => {
                return false
            }).WithName("finish")
            task.AddTrigger(matcheraskkey, (tri, result) => {
                let name = result[1]
                let id = result[2].toLowerCase()
                let pass = result[3]
                Note(`收到${name}(${id}）的key请求 密码:${pass}`)
                if (pass != "" && pass == App.Core.Dummy.Password) {
                    App.Send(`give key to ${id};i`)
                    return false
                }
                return true
            }).WithName("key")
        },
        (reuslt) => {
            $.Next()
        }
    )
    Dummy.Wait = function () {
        $.PushCommands(
            $.To("chat"),
            $.Plan(PlanWait),
        )
        $.Next()
    }
    Dummy.AskKey = function () {
        $.Insert($.Function(Dummy.Start))
        $.PushCommands(
            $.To("qz"),
            $.Do("qu 10 silver"),
            $.Nobusy(),
            $.To("lu ban"),
            $.Do("ask lu ban about key;give 10 silver to lu ban;i")
        )
        $.Next()
    }
    Dummy.Start = function (data) {
        $.PushCommands(
            $.Prepare(),
            $.Function(Dummy.CheckKey),
        )
        $.Next()
    }
    let Quest = App.Quests.NewQuest("dummy")
    Quest.Name = "聊天大米"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = "dummy"
    App.Quests.Register(Quest)

    Quest.Start = function (data) {
        Dummy.Start(data)
    }
    Quest.GetReady = function (q, data) {
        return () => { Quest.Start(data) }
    }
})