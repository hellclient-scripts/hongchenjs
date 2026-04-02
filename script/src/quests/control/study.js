$.Module(function (App) {
    let actionModule = App.RequireModule("helllibjs/conditions/action.js")
    let Quest = App.Quests.NewQuest("study")
    Quest.Name = "设置学习列表"
    Quest.Desc = ""
    Quest.Intro = "在当前任务队列动态添加学习列表"
    Quest.Help = ""
    Quest.Group = "control"
    App.Quests.Register(Quest)


    Quest.GetReady = function (q, data) {
        if (!App.Quests.Data.StudyReady[App.Quests.Processing]) {
            App.Quests.Data.StudyReady[App.Quests.Processing] = true
            let action = actionModule.Parse(data)
            App.Quests.Data.Study.push(App.Core.Study.NewLearn(action.Data))
        }
        return null;
    }
    App.Core.Quest.AppendInitor(() => {
        App.Quests.Data.Study=[]
        App.Quests.Data.StudyReady = {}
    })
})