//练功模块
$.Module(function (App) {
    let Learn = {}
    Learn.NeedJifa = false
    Learn.Start = () => {
        let changequest = false
        let ready = App.Quests.GetReady()
        if (ready && ready.RunningQuest && ready.RunningQuest.ID != Quest.ID) {
            changequest = true
        }

        if (!App.Quests.Stopped && !changequest) {

            let skill = App.Core.Study.FilterSkill()
            if (skill) {
                let context = {}
                context.NeiliMin = 15
                $.PushCommands(
                    $.Prepare("common", context),
                    $.Function(() => { skill.Execute() }),
                    $.Function(() => { Learn.Start() }),
                )
            }
        }
        App.Next()
    }
    Learn.Start2 = () => {
        let changequest = false
        let ready = App.Quests.GetReady()
        if (ready && ready.RunningQuest && ready.RunningQuest.ID != Quest.ID) {
            changequest = true
        }
        if (!App.Quests.Stopped && !changequest && App.Core.Study.JiquNotFinish(true)) {
            $.Insert(App.Commands.NewFunctionCommand(App.Core.Study.JiquPauseStep))
        }
        App.Next()
    }
    Learn.Start3 = () => {
        let changequest = false
        let ready = App.Quests.GetReady()
        if (ready && ready.RunningQuest && ready.RunningQuest.ID != Quest.ID) {
            changequest = true
        }

        if (!App.Quests.Stopped && !changequest) {
            let skill = App.Core.Study.FilterLian()
            if (skill) {
                let context = {}
                context.NeiliMin = 15
                Learn.NeedJifa = true
                $.Insert(
                    $.Prepare("common", context),
                    $.Function(() => { skill.Execute() }),
                    $.Function(() => { Learn.Start3() }),
                )
            }
        } else {
            //不继续练功了，激发技能
            if (Learn.NeedJifa) {
                // App.Core.Timeslice.Change("")
                $.Append(
                    $.Do("#jifa"),
                )
                Learn.NeedJifa = false
            }
        }
        App.Next()
    }

    //定义任务
    let Quest = App.Quests.NewQuest("learn")
    Quest.Name = "学习"
    Quest.Timeslice = "学习"
    Quest.Desc = "独立学习模块"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.GetReady = function (q, data) {
        if (!App.Core.Study.HitMinPot() && App.Core.Study.AllCanLearn().length > 0) {
            let maxpot = GetVariable("max_pot") - 0
            if (!isNaN(maxpot) && maxpot > 0 && App.Data.Player.HP["潜能"] >= maxpot) {
                let skill = App.Core.Study.FilterSkill()
                if (skill) {
                    return () => { Learn.Start(data) }
                }
            }
        }
        if (App.Core.Study.AllCanLian().length > 0) {
            return () => { Learn.Start3(data) }
        }
        if (App.Core.Study.JiquNotFinish(true) && App.Core.Study.NeedJiqu(App.Core.Study.Jiqu.Max)) {
            return () => { Learn.Start2(data) }
        }
        return null
    }
    Quest.Preflight = function () {
        App.Quests.Data.NoStudy = true
    }
    Quest.Start = function () {
        Learn.Start()
    }
    Quest.Group = "learn"
    App.Quests.Register(Quest)
})