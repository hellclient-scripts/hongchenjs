$.Module(function (App) {
    let Freequest = {}
    Freequest.Data = {}
    Freequest.Data.XiaoerList = []
    App.Mapper.Database.APIListTraces(App.Mapper.HMM.APIListOption.New().WithKeys(["xiaoer"]))[0].Locations.forEach(item => {
        Freequest.Data.XiaoerList.push(item)
    })
    Freequest.GoAsk = function () {
        let loc = App.Random(Freequest.Data.XiaoerList)
        $.PushCommands(
            $.To(loc),
            $.Ask("xiao er", "rumor", 1)
        )
        $.Next()
    }
    Freequest.AfterAsk = function () {
        Dump(App.Data.Ask)
    }
    let Quest = App.Quests.NewQuest("freequest")
    Quest.Name = "公共任务"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = ""
    Quest.OnHUD = () => {
    }
    Quest.OnSummary = () => {
    }
    Quest.OnReport = () => {
    }
    Quest.Start = function (data) {
        Freequest.GoAsk()
    }
    App.Quests.Register(Quest)
    App.Quests.Freequest = Freequest
})