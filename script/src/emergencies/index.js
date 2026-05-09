(function (App) {
    App.Emergencies = {}
    App.Include("src/emergencies/maintenance.js")
    App.Include("src/emergencies/deathprotect.js")
    App.Include("src/emergencies/breakup.js")
    App.Include("src/emergencies/mingsi.js")
})(App)