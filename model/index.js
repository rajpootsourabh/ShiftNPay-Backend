
module.exports = {
    UserModel : require("./User"),
    EmployeeModel : require("./Employee"),
    ConversationModel : require("./Chat/ConversationModel"),
    MessagesModel : require("./Chat/MessagesModel"),

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
}