$.Module(function (App) {
    let Quest = App.Quests.NewQuest("nojiqu")
    Quest.Name = "禁用汲取"
    Quest.Desc = ""
    Quest.Intro = "在当前任务队列中禁用汲取"
    Quest.Help = ""
    Quest.Group = "control"
    App.Quests.Register(Quest)

    
    Quest.GetReady = function (q, data) {
        App.Quests.Data.NoJiqu = true
        return null;
    }

})