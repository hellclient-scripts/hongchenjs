(function (App) {
    class Need {
        constructor(mc, soul) {
            this.MC = mc
            this.Soul = soul
        }
        MC = 0
        Soul = 0
    }
    App.Emergencies.Mingsi = {}
    App.Emergencies.Mingsi.Need = {}
    App.Emergencies.Mingsi.Need[0] = new Need(600, 0)
    App.Emergencies.Mingsi.Need[1] = new Need(700, 1000)
    App.Emergencies.Mingsi.Need[2] = new Need(800, 2000)
    App.Emergencies.Mingsi.Need[3] = new Need(1000, 4000)
    App.Emergencies.Mingsi.Need[4] = new Need(1500, 8000)
    App.Emergencies.Mingsi.Need[5] = new Need(2000, 16000)
    App.Emergencies.Mingsi.Go = function () {
        $.PushCommands(
            $.To("action-mingsi"),
            $.Do("mingsi"),
            $.Nobusy(),
            $.Do("score;cha"),
            $.Nobusy(),
        )
        $.Next()
    }
    App.Core.Quest.HeadReadyQueue.push(function () {
        if (App.PolicyParams["mingsi"] == "t") {
            let need = App.Emergencies.Mingsi.Need[App.Data.Player.Score["转生次数"]]
            if (need && App.Core.Player.GetSkillLevelByID("martial-cognize") > need.MC && App.Data.Player.Score["转生灵魂"] < need.Soul) {
                return App.Emergencies.Mingsi.Go
            }
        }
        return null
    })
})(App)
