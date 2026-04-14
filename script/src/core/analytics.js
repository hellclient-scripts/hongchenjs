(function (App) {
    App.Core.Analytics = {}
    App.Core.Analytics.Tasks = {}
    App.Core.Analytics.RegisterTask = function (ID, Label, Timeslice) {
        App.Core.Analytics.Tasks[ID] = new Task(ID, Label, Timeslice)
    }
    App.Core.Analytics.Add = function (ID, Exp, Pot, Tihui) {
        if (App.Core.Analytics.Tasks[ID] == null) {
            throw `未登记的分析任务 ${ID}`
            return
        }
        let task = App.Core.Analytics.Tasks[ID]
        task.Exp += Exp
        task.Pot += Pot
        task.Tihui += Tihui
    }
    App.Core.Analytics.List = () => {
        let result = []
        for (let key in App.Core.Analytics.Tasks) {
            let task = App.Core.Analytics.Tasks[key]
            if (task.Exp > 0 || task.Pot > 0 || task.Tihui > 0) {
                result.push({
                    ID: task.ID,
                    Label: task.Label,
                    Timeslice: task.Timeslice,
                    Exp: task.Exp,
                    Pot: task.Pot,
                    Tihui: task.Tihui,
                })
            }
        }
        result.sort((a, b) => {
            if (a.Tihui < b.Tihui) {
                return -1
            }
            return 1
        })
        return result
    }
    App.Core.Analytics.Reset = function () {
        for (let key in App.Core.Analytics.Tasks) {
            let task = App.Core.Analytics.Tasks[key]
            task.Reset()
        }
    }
    class Task {
        constructor(ID, Label, Timeslice) {
            this.ID = ID
            this.Label = Label
            this.Timeslice = Timeslice
        }
        ID = ""
        Label = ""
        Timeslice = ""
        Exp = 0
        Pot = 0
        Tihui = 0
        Reset() {
            this.Exp = 0
            this.Pot = 0
            this.Tihui = 0
        }
    }

})(App)