//任务模块
(function (App) {
    let questsModule = App.RequireModule("helllibjs/quests/quests.js")
    let conditionsModule = App.RequireModule("helllibjs/conditions/conditions.js")
    App.Core.Quest = {}
    App.Core.Quest.StartedAt = 0
    //start别名
    App.Core.Quest.OnAlias = function (n, l, w) {
        let q = w[0].trim()
        if (q) {
            App.Core.Quest.Exec(w[0])
            return
        }
        q = GetVariable("quest").trim()
        if (q) {
            if (q.indexOf("\n") < 0 && q.startsWith("#")) {
                Note(`执行别名 ${q}`)
                world.Execute(q)
                return
            }
            App.Core.Quest.Exec(q)
            return
        }
        PrintSystem("quest变量为空，未指定任务。")
    }
    App.Quest = {}
    //当前任务
    App.Core.Quest.Current = ""
    //解析处理行信息
    App.Core.Quest.Exec = function (line) {
        App.Commands.PushCommands(
            App.Commands.NewFunctionCommand(App.Init),
            App.Commands.NewFunctionCommand(() => {
                App.Core.Quest.Current = line.trim()
                App.Quests.StartLine(line.trim())
            }),
        )
        App.Next()
    }
    //创建实例并初始化
    App.Quests = new questsModule.Quests(App.Positions["Quest"], App.Commands, new conditionsModule.Conditions)
    App.BindEvent("core.stop", function () {
        App.Quests.Stop()
    })
    App.Core.Quest.Initors = []
    App.Core.Quest.AppendInitor = function (cb) {
        App.Core.Quest.Initors.push(cb)
    }
    App.Quests.OnStart = () => {
        App.Core.Timeslice.Reset()
        App.Core.Quest.StartedAt = (new Date()).getTime()
        App.Core.Quest.Initors.forEach(cb => cb())
        App.RaiseEvent(new App.Event("core.queststart"))
    }
    App.Quests.OnStop = () => {
        App.Core.Quest.Current = ""
        App.Core.Stage.ChangeStance("")
        App.RaiseEvent(new App.Event("core.queststop"))
    }
    App.Quests.OnNext = (quests) => {
        App.Core.Timeslice.Change("")
    }
    App.Quests.OnExec = (quests, ready) => {
        let quest=ready.Quest
        let ts=quest.Timeslice?quest.Timeslice:quest.Name
        App.Core.Timeslice.Change(ts)
    }
    App.Quests.DelayFunction = function (quests) {
        quests.Commands.PushCommands(
            $.Timeslice("切换任务"),
            quests.Commands.NewWaitCommand(this.Delay),
            $.Timeslice(""),
        )
    }
    App.Quests.ReadyCreator = (r, exec, q) => {
        return new questsModule.Ready(r, () => {
            App.Core.Stage.ChangeStance(q.Group)
            exec()
        }, q)

    }
    //注册maxexp 条件
    App.Quests.Conditions.RegisterMatcher(App.Quests.Conditions.NewMatcher("maxexp", function (data, target) {
        return App.Data.Player.HP["经验"] <= (data - 0)
    }))
    //注册yueli 条件
    App.Quests.Conditions.RegisterMatcher(App.Quests.Conditions.NewMatcher("yueli", function (data, target) {
        return App.Data.Player.Score["阅历"] >= (data - 0)
    }))
    //注册pot 条件
    App.Quests.Conditions.RegisterMatcher(App.Quests.Conditions.NewMatcher("pot", function (data, target) {
        return App.Data.Player.HP["潜能"] >= (data - 0)
    }))
    //注册tihui 条件
    App.Quests.Conditions.RegisterMatcher(App.Quests.Conditions.NewMatcher("tihui", function (data, target) {
        return App.Data.Player.HP["体会"] >= (data - 0)
    }))
    //注册quest 条件
    App.Quests.Conditions.RegisterMatcher(App.Quests.Conditions.NewMatcher("quest", function (data, target) {
        let rq = App.Quests.Running
        return rq && rq.ID == data
    }))
    //注册full 条件
    App.Quests.Conditions.RegisterMatcher(App.Quests.Conditions.NewMatcher("full", function (data, target) {
        if (App.Params.FullTihui > 0 && App.Data.Player.HP["体会"] >= App.Params.FullTihui) {
            return true
        }
        if (App.Params.FullPot > 0 && App.Data.Player.HP["潜能"] >= App.Params.FullPot) {
            return true
        }
        return false
    }))

})(App)            
