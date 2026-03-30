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

    Zhonghua.Start = () => {
        $.PushCommands(
            $.Timeslice("种花"),
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

})