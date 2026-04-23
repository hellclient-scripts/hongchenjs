(function (App) {
    App.Emergencies = {}
    App.Include("src/emergencies/maintenance.js")
    App.Include("src/emergencies/deathprotect.js")
})(App)