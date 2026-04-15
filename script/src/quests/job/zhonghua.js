//钓鱼模块
$.Module(function (App) {
    var Zhonghua = {}
    let preparedata = {}
    preparedata[App.Core.Assets.PrepareDataKey] = [
        App.Core.Assets.ParseRule("#sell name=玫瑰,黄玫瑰,蓝天鹅,紫罗兰,白茶花"),
    ]

    //准备鱼杆鱼饵
    App.Proposals.Register("quest.zhonghua", App.Proposals.NewProposal(function (proposals, context, exclude) {
        if (App.Data.Item.List.FindByID("hua zhong").First() == null) {
            return function () {
                $.PushCommands(
                    $.Buy("hua zhong"),
                )
                $.Next()
            }
        }
        return null
    }))
    App.Proposals.Register("commonWithQuestZhonghua", App.Proposals.NewProposalGroup("quest.zhonghua"))
    //通过这次训练，你获得了五十三点经验和一点潜能。
    let matcherRewart=/^通过这次训练，你获得了(.+)点经验和(.+)点潜能。$/
    let PlanQuest= new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherRewart,(tri,result)=>{
                App.Core.Analytics.Add(Quest.ID,App.CNumber.ParseNumber(result[1]),App.CNumber.ParseNumber(result[2]),0)
                return true
            })
        })
    Zhonghua.Start = () => {
        PlanQuest.Execute()
        $.PushCommands(
            // $.Timeslice("种花"),
            $.Prepare("commonWithQuestZhonghua", preparedata),
            $.To("job-zhonghua"),
            $.Nobusy(),
            $.Do("zhonghua;i"),
            $.Nobusy(),
            $.Do("yun regenerate;peiyu"),
            $.Nobusy(),
            $.Do("yun regenerate;jiaoshui"),
            $.Nobusy(),
            $.Do("yun regenerate;jiaoshui;i"),
            $.Nobusy(),
            // $.Timeslice(""),
            $.Prepare("commonWithStudy",preparedata),
        )
        App.Next()
    }
    //定义任务
    let Quest = App.Quests.NewQuest("zhonghua")
    Quest.Name = "种花"
    Quest.Desc = "新人种花任务"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Start = function (data) {
        Zhonghua.Start()
    }
    App.Quests.Register(Quest)
    App.Core.Analytics.RegisterTask(Quest.ID,Quest.Name,Quest.Timeslice ? Quest.Timeslice : Quest.Name)

})