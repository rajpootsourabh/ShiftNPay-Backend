const menuCategories = [
  {
    title: "Employee Management",
    cat: 1,
    icon: "MdPeople",
    routes: [
      { title: "Dashboard", path: "/", icon: "MdDashboard" ,component : "Home" , isOuter: true},
      { title: "Employees", path: "/staff", icon: "MdPeople" ,component : "Staff" , isOuter: true},
      { title: "Employees", path: "/staff/:id", icon: "MdPeople" ,component : "EmpDetails" , isOuter: false},
      { title: "Jobs", path: "/job", icon: "MdWork" ,component : "Jobs" , isOuter: true},
      { title: "Shift Master", path: "/shift", icon: "MdManageHistory" ,component : "Shift" , isOuter: true},
      { title: "Shift Master", path: "/shift/assign/:id", icon: "MdManageHistory" ,component : "ShiftAssign" , isOuter: false},
      { title: "Shift Master", path: "/shift/:id", icon: "MdManageHistory" ,component : "EmpDetails" , isOuter: false},
      { title: "Shift Schedule", path: "/shift-schedule", icon: "MdManageHistory" ,component : "ShiftSchedule" , isOuter: false},
      { title: "Invoice ", path: "/send-invoice", icon: "MdManageHistory" ,component : "Invoice" , isOuter: true},
      { title: "Shift Master", path: "/product", icon: "MdManageHistory" ,component : "Product" , isOuter: false},
      { title: "PTO(rewards)", path: "/rewards", icon: "CiGift" ,component : "RewardManagement" , isOuter: true},
      { title: "Auto scheduling", path: "/auto-scheduling", icon: "MdAutoMode" ,component : "AutoSchedular" , isOuter: true},
      { title: "Chat", path: "/chat", icon: "MdChat" ,component : "ChatApp" , isOuter: true},
      { title: "Notifications", path: "/notifications", icon: "MdOutlineEditNotifications" ,component : "NotificationList" , isOuter: true},
      { title: "Account", path: "/account", icon: "MdSettings" ,component : "Profile" , isOuter: true},
      { title: "Documents", path: "/documents", icon: "MdReceipt" ,component : "VendorDashboard" , isOuter: true},
    ],
  },
  {
    title: "Time & Attendance",
    cat: 2,
    icon: "MdAccessTime",
    routes: [
      { title: "Tracker Management", path: "/timeTracker", icon: "MdAccessTime" ,component : "TimeTracker" , isOuter: true},
      { title: "Tracker Requests", path: "/tracker-approvals", icon: "MdTimer" ,component : "TimeTrackerRequest" , isOuter: true},
      { title: "Check-List", path: "/checkList", icon: "MdCheckBox" ,component : "CheckList" , isOuter: true},
      { title: "OT Calculations", path: "/state", icon: "TbBriefcase" ,component : "State" , isOuter: true},
    ],
  },
  {
    title: "Leave Management",
    cat: 3,
    icon: "MdCalendarToday",
    routes: [
      { title: "Leave Types", path: "/leave-management/types", icon: "MdWorkOff" ,component : "LeaveTypeManagement" , isOuter: true},
      { title: "Leave Management", path: "/leave-management", icon: "MdSettings" ,component : "EmployeeLeaveList" , isOuter: true},
      { title: "Leave Management", path: "/leave-management/add", icon: "MdSettings" ,component : "AddLeave" , isOuter: false},
      { title: "Leave Requests", path: "/leave-request", icon: "MdCalendarToday" ,component : "LeaveRequest" , isOuter: true},
      { title: "Holidays", path: "/holidays", icon: "MdCalendarToday" ,component : "Holidays" , isOuter: true},
    ],
  },
  {
    title: "Reports & Analytics",
    cat: 4,
    icon: "MdAssessment",
    routes: [
      { title: "Analytics", path: "/analytics", icon: "MdAssessment" ,component : "Anlaytics" , isOuter: true},
      { title: "Reports", path: "/report", icon: "TbReportAnalytics" ,component : "ExportAllEmployeesData" , isOuter: true},
    ],
  },
  {
    title: "Financials",
    cat: 5,
    icon: "MdOutlineAccountBalance",
    routes: [
      { title: "Invoices", path: "/invoice", icon: "MdOutlineAccountBalance" ,component : "InvoiceListing" , isOuter: true},
    ],
  },
];

module.exports = menuCategories;
