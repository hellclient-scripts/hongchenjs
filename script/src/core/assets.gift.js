(function (App) {
    let objectModule = App.RequireModule("helllibjs/object/object.js")
    App.Core.Assets.Gift = {}
    App.Core.Assets.Gift.Items = {}
    App.LoadLines("data/gifts.txt", "|").forEach((data) => {
        App.Core.Assets.Gift.Items[data[0].trim()] = {
            Name: data[0].trim(),
            ID: data[1].trim(),
        }
    })
    App.Core.Assets.Gift.Load = function (name) {
        return App.Core.Assets.Gift.Items[name]
    }
    App.Core.Assets.Gift.CanHome = function () {
        return (App.Data.Item.List.FindByID("key").First() != null || App.Core.Dummy.ID != "" || App.Core.Dummy.ID != null)
    }
    App.Core.Assets.Gift.Need = function (name) {
        let item = App.Core.Assets.Gift.Load(name)
        if (item == null) {
            App.Log(`未登记的奖励 ${name}`)
            return true
        }
        let obj = new objectModule.Object(item.Name, item.ID, item.Name)

        let action = App.Core.Assets.Maintain(obj)
        switch (action && action.Command) {
            case "#store":
            case "#carry":
                return true
            case "home":
                return App.Core.Assets.Gift.CanHome()
        }
        return false
    }
})(App)