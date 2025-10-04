const express = require('express');
const router = express.Router();
const  authMiddleware  = require('../middleware/authMiddleware');

const agencyController = require('./../controller/IDB_SYS/Client/Agency');
const NoteTypesController = require('./../controller/IDB_SYS/Client/NoteTypes');
const ClientTypesController = require('./../controller/IDB_SYS/Client/CleintTypes');
const CountryController = require('./../controller/IDB_SYS/Client/Country');
const CustomFieldController = require('./../controller/IDB_SYS/Client/CustomField');
const DisciplineController = require('./../controller/IDB_SYS/Client/Discipline');
const LocationController = require('./../controller/IDB_SYS/Client/Location');
const MedicationController = require('./../controller/IDB_SYS/Client/Medication');
const NeedController = require('./../controller/IDB_SYS/Client/Need');
const OtherNoteTypeController = require('./../controller/IDB_SYS/Client/OtherNoteType');
const ReasonController = require('./../controller/IDB_SYS/Client/Reason');
const ReferralSourceController = require("../controller/IDB_SYS/Client/ReferralSource");
const RelationshipController = require('./../controller/IDB_SYS/Client/Relationship');
const SalesRepController = require('./../controller/IDB_SYS/Client/SalesRep');
const ReminderListController = require('./../controller/IDB_SYS/Client/ReminderList');
const TimeSpanController = require('./../controller/IDB_SYS/Client/TimeSpan');
const ServiceCodeController = require('./../controller/IDB_SYS/Client/ServiceCode');
const CaseManagerController = require('./../controller/IDB_SYS/Client/CaseManager');
const CareGiverController = require('./../controller/IDB_SYS/Client/CareGiver');
const ClientController = require('./../controller/IDB_SYS/Client/Client');
const PhysicianController = require('./../controller/IDB_SYS/Client/Physician');
const PayorController = require('./../controller/IDB_SYS/Client/Payor');
const scheduleController = require('./../controller/IDB_SYS/Schedule/scheduleController');
const timesheetController = require('./../controller/IDB_SYS/TimeSheet/TimeSheetWeek');


router.get('/agency', authMiddleware.employer, agencyController.getAgenciesByVendor);
router.get('/agency/single/:id', authMiddleware.employer, agencyController.getAgencyById);
router.post('/agency', authMiddleware.employer, agencyController.createAgency);
router.put('/agency/:id', authMiddleware.employer, agencyController.updateAgency);
router.delete('/agency/:id', authMiddleware.employer, agencyController.deleteAgency);

router.get('/noteTypes', authMiddleware.employer, NoteTypesController.getNoteTypesByVendor);
router.get('/noteTypes/single/:id', authMiddleware.employer, NoteTypesController.getNoteTypeById);
router.post('/noteTypes', authMiddleware.employer, NoteTypesController.createNoteType);
router.put('/noteTypes/:id', authMiddleware.employer, NoteTypesController.updateNoteType);
router.delete('/noteTypes/:id', authMiddleware.employer, NoteTypesController.deleteNoteType);

router.get('/clientTypes', authMiddleware.employer, ClientTypesController.getClientTypesByVendor);
router.get('/clientTypes/single/:id', authMiddleware.employer, ClientTypesController.getClientTypeById);
router.post('/clientTypes', authMiddleware.employer, ClientTypesController.createClientType);
router.put('/clientTypes/:id', authMiddleware.employer, ClientTypesController.updateClientType);
router.delete('/clientTypes/:id', authMiddleware.employer, ClientTypesController.deleteClientType);

router.get('/country', authMiddleware.employer, CountryController.getCountryByVendor);
router.get('/country/single/:id', authMiddleware.employer, CountryController.getCountryById);
router.post('/country', authMiddleware.employer, CountryController.createCountry);
router.put('/country/:id', authMiddleware.employer, CountryController.updateCountry);
router.delete('/country/:id', authMiddleware.employer, CountryController.deleteCountry);

router.get('/customFields', authMiddleware.employer, CustomFieldController.getCustomFieldByVendor);
router.get('/customFields/single/:id', authMiddleware.employer, CustomFieldController.getCustomFieldById);
router.post('/customFields', authMiddleware.employer, CustomFieldController.createCustomField);
router.put('/customFields/:id', authMiddleware.employer, CustomFieldController.updateCustomField);
router.delete('/customFields/:id', authMiddleware.employer, CustomFieldController.deleteCustomField);

router.get('/disciplines', authMiddleware.employer, DisciplineController.getDisciplineByVendor);
router.get('/disciplines/single/:id', authMiddleware.employer, DisciplineController.getDisciplineById);
router.post('/disciplines', authMiddleware.employer, DisciplineController.createDiscipline);
router.put('/disciplines/:id', authMiddleware.employer, DisciplineController.updateDiscipline);
router.delete('/disciplines/:id', authMiddleware.employer, DisciplineController.deleteDiscipline);

router.get('/locations', authMiddleware.employer, LocationController.getLocationsByVendor);
router.get('/locations/single/:id', authMiddleware.employer, LocationController.getLocationById);
router.post('/locations', authMiddleware.employer, LocationController.createLocation);
router.put('/locations/:id', authMiddleware.employer, LocationController.updateLocation);
router.delete('/locations/:id', authMiddleware.employer, LocationController.deleteLocation);

router.get('/medication', authMiddleware.employer, MedicationController.getMedicationByVendor);
router.get('/medication/single/:id', authMiddleware.employer, MedicationController.getMedicationById);
router.post('/medication', authMiddleware.employer, MedicationController.createMedication);
router.put('/medication/:id', authMiddleware.employer, MedicationController.updateMedication);
router.delete('/medication/:id', authMiddleware.employer, MedicationController.deleteMedication);

router.get('/need', authMiddleware.employer, NeedController.getNeedByVendor);
router.get('/need/single/:id', authMiddleware.employer, NeedController.getNeedById);
router.post('/need', authMiddleware.employer, NeedController.createNeed);
router.put('/need/:id', authMiddleware.employer, NeedController.updateNeed);
router.delete('/need/:id', authMiddleware.employer, NeedController.deleteNeed);

router.get('/otherNoteType', authMiddleware.employer, OtherNoteTypeController.getOtherNoteTypeByVendor);
router.get('/otherNoteType/single/:id', authMiddleware.employer, OtherNoteTypeController.getOtherNoteTypeById);
router.post('/otherNoteType', authMiddleware.employer, OtherNoteTypeController.createOtherNoteType);
router.put('/otherNoteType/:id', authMiddleware.employer, OtherNoteTypeController.updateOtherNoteType);
router.delete('/otherNoteType/:id', authMiddleware.employer, OtherNoteTypeController.deleteOtherNoteType);

router.get('/reason', authMiddleware.employer, ReasonController.getReasonByVendor);
router.get('/reason/single/:id', authMiddleware.employer, ReasonController.getReasonById);
router.post('/reason', authMiddleware.employer, ReasonController.createReason);
router.put('/reason/:id', authMiddleware.employer, ReasonController.updateReason);
router.delete('/reason/:id', authMiddleware.employer, ReasonController.deleteReason);

// Referral Sources Routes
router.get("/referral-sources", authMiddleware.employer, ReferralSourceController.getReferralSources);
router.get("/referral-sources/:id", authMiddleware.employer, ReferralSourceController.getReferralSourceById);
router.post("/referral-sources", authMiddleware.employer, ReferralSourceController.createReferralSource);
router.put("/referral-sources/:id", authMiddleware.employer, ReferralSourceController.updateReferralSource);
router.delete("/referral-sources/:id", authMiddleware.employer, ReferralSourceController.deleteReferralSource)

router.get('/relationship', authMiddleware.employer, RelationshipController.getRelationshipByVendor);
router.get('/relationship/single/:id', authMiddleware.employer, RelationshipController.getRelationshipById);
router.post('/relationship', authMiddleware.employer, RelationshipController.createRelationship);
router.put('/relationship/:id', authMiddleware.employer, RelationshipController.updateRelationship);
router.delete('/relationship/:id', authMiddleware.employer, RelationshipController.deleteRelationship);

router.get('/salesRep', authMiddleware.employer, SalesRepController.getSalesRepByVendor);
router.get('/salesRep/single/:id', authMiddleware.employer, SalesRepController.getSalesRepById);
router.post('/salesRep', authMiddleware.employer, SalesRepController.createSalesRep);
router.put('/salesRep/:id', authMiddleware.employer, SalesRepController.updateSalesRep);
router.delete('/salesRep/:id', authMiddleware.employer, SalesRepController.deleteSalesRep);

router.get('/reminderList', authMiddleware.employer, ReminderListController.getReminderListByVendor);
router.get('/reminderList/single/:id', authMiddleware.employer, ReminderListController.getReminderListById);
router.post('/reminderList', authMiddleware.employer, ReminderListController.createReminderList);
router.put('/reminderList/:id', authMiddleware.employer, ReminderListController.updateReminderList);
router.delete('/reminderList/:id', authMiddleware.employer, ReminderListController.deleteReminderList);


router.get('/timeSpan', authMiddleware.employer, TimeSpanController.getTimeSpanByVendor);
router.get('/timeSpan/single/:id', authMiddleware.employer, TimeSpanController.getTimeSpanById);
router.post('/timeSpan', authMiddleware.employer, TimeSpanController.createTimeSpan);
router.put('/timeSpan/:id', authMiddleware.employer, TimeSpanController.updateTimeSpan);
router.delete('/timeSpan/:id', authMiddleware.employer, TimeSpanController.deleteTimeSpan);

router.get('/serviceCode', authMiddleware.employer, ServiceCodeController.getServiceCodeByVendor);
router.get('/serviceCode/single/:id', authMiddleware.employer, ServiceCodeController.getServiceCodeById);
router.post('/serviceCode', authMiddleware.employer, ServiceCodeController.createServiceCode);
router.put('/serviceCode/:id', authMiddleware.employer, ServiceCodeController.updateServiceCode);
router.delete('/serviceCode/:id', authMiddleware.employer, ServiceCodeController.deleteServiceCode);


router.get('/caseManager', authMiddleware.employer, CaseManagerController.getCaseManagerByVendor);
router.get('/caseManager/single/:id', authMiddleware.employer, CaseManagerController.getCaseManagerById);
router.post('/caseManager', authMiddleware.employer, CaseManagerController.createCaseManager);
router.put('/caseManager/:id', authMiddleware.employer, CaseManagerController.updateCaseManager);
router.delete('/caseManager/:id', authMiddleware.employer, CaseManagerController.deleteCaseManager);


router.get('/careGiver', authMiddleware.employer,CareGiverController.getCareGiverByVendor);
router.get('/careGiver/single/:id', authMiddleware.employer,CareGiverController.getCareGiverById);
router.post('/careGiver', authMiddleware.employer,CareGiverController.createCareGiver);
router.put('/careGiver/:id', authMiddleware.employer,CareGiverController.updateCareGiver);
router.delete('/careGiver/:id', authMiddleware.employer,CareGiverController.deleteCareGiver);


router.get('/client', authMiddleware.employer,ClientController.getClientByVendor);
router.get('/client/single/:id', authMiddleware.employer,ClientController.getClientById);
router.post('/client', authMiddleware.employer,ClientController.createClient);
router.put('/client/:id', authMiddleware.employer,ClientController.updateClient);
router.delete('/client/:id', authMiddleware.employer,ClientController.deleteClient);


router.get('/physician', authMiddleware.employer,PhysicianController.getPhysician);
router.get('/physician/single/:id', authMiddleware.employer,PhysicianController.getPhysicianById);
router.post('/physician', authMiddleware.employer,PhysicianController.createPhysician);
router.put('/physician/:id', authMiddleware.employer,PhysicianController.updatePhysician);
router.delete('/physician/:id', authMiddleware.employer,PhysicianController.deletePhysician);


router.get('/payor', authMiddleware.employer,PayorController.getPayor);
router.get('/payor/single/:id', authMiddleware.employer,PayorController.getPayorById);
router.post('/payor', authMiddleware.employer,PayorController.createPayor);
router.put('/payor/:id', authMiddleware.employer,PayorController.updatePayor);
router.delete('/payor/:id', authMiddleware.employer,PayorController.deletePayor);

router.get('/schedule', authMiddleware.employer,scheduleController.getAllSchedules);
router.get('/schedule/date-range', authMiddleware.employer,scheduleController.getSchedulesByDateRange);
router.get('/schedule/:id', authMiddleware.employer,scheduleController.getSchedule);
router.post('/schedule', authMiddleware.employer,scheduleController.createSchedule);
router.put('/schedule/:id', authMiddleware.employer,scheduleController.updateSchedule);
router.delete('/schedule/:id', authMiddleware.employer,scheduleController.deleteSchedule);
router.get('/schedule/jobs/all', authMiddleware.employer, scheduleController.fetchVendorJobs)

router.post( '/timesheet-weeks',authMiddleware.employer,timesheetController.createWeeksRange);
router.get('/timesheet-weeks',authMiddleware.employer,timesheetController.getAllWeeks);
router.patch('/timesheet-weeks/:id/lock',authMiddleware.employer,timesheetController.lockWeek);
router.patch('/timesheet-weeks/:id/unlock',authMiddleware.employer,timesheetController.unlockWeek);
router.post('/timesheet-weeks/recreate',authMiddleware.employer,timesheetController.updateWeek);
router.post( '/timesheet-weeks/fetch-schedules',authMiddleware.employer,timesheetController.fetchWeeklySchedules);


module.exports = router;
