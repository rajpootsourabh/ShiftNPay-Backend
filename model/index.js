
module.exports = {
    UserModel : require("./User"),
    JobModel : require("./Job"),
    EmployeeModel : require("./Employee"),
    ConversationModel : require("./Chat/ConversationModel"),
    MessagesModel : require("./Chat/MessagesModel"),
    Tracking : require("./Tracking"),

    //  new system models 
    AgencyModel : require('./IDB_SYS/Client/Agency'),
    NoteTypes : require('./IDB_SYS/Client/NoteTypes'),
    ClientTypes : require('./IDB_SYS/Client/ClientTypes'),
    Country : require('./IDB_SYS/Client/Country'),
    CustomField : require('./IDB_SYS/Client/CustomField'),
    Discipline : require('./IDB_SYS/Client/Discipline'),
    Location : require('./IDB_SYS/Client/Location'),
    Medication : require('./IDB_SYS/Client/MedicationsMasterList'),
    Need : require('./IDB_SYS/Client/Need'),
    OtherNoteType : require('./IDB_SYS/Client/OtherNoteType'),
    Reason : require('./IDB_SYS/Client/Reason'),
    Relationship : require('./IDB_SYS/Client/Relationship'),
    SalesRep : require('./IDB_SYS/Client/SalesRep'),
    ReminderList : require('./IDB_SYS/Client/ReminderList'),
    TimeSpan : require('./IDB_SYS/Client/TimeSpan'),
    ServiceCode : require('./IDB_SYS/Client/ServiceCode'),
    CaseManager : require('./IDB_SYS/Client/CaseManager'),
    Client : require('./IDB_SYS/Client/Client'),
    Physician : require('./IDB_SYS/Client/Physician'),
    Payor : require('./IDB_SYS/Client/Payor'),
    //  schedule model
    Schedule : require('./IDB_SYS/Schedule/Schedule'),
    //  time sheet model
    TimesheetWeek : require('./IDB_SYS/TimeSheet/TimesheetWeek')
    
}