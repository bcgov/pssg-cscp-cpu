import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

/** Minimal Transmogrifier-shaped object used as the initial value of StateService.main.
 *  Keeps components that subscribe in ngOnInit from crashing on null access. */
const emptyState = {
  accountId: "",
  contactInformation: {
    boardContact: null,
    emailAddress: null,
    faxNumber: null,
    mainAddress: null,
    ministryContact: null,
    phoneNumber: null,
    secondaryAddress: null,
  },
  contracts: [],
  ministryContact: null,
  organizationId: "",
  organizationName: "",
  persons: [],
  role: null,
  userId: "",
};

const emptyUser = {
  email: null,
  fax: null,
  firstName: null,
  lastName: null,
  middleName: null,
  personId: null,
  phone: null,
  title: null,
  userId: "",
  me: false,
};

@Injectable({ providedIn: "root" })
export class StateService {
  main = new BehaviorSubject<any>(emptyState);
  currentUser = new BehaviorSubject<any>(emptyUser);
  loggedIn = new BehaviorSubject<boolean>(false);
  newUser = new BehaviorSubject<boolean>(false);
  homeRoute = new BehaviorSubject<string>("");
  loading = new BehaviorSubject<boolean>(false);
  userSettings = new BehaviorSubject<any>({ userRole: null });

  login() {}
  logout() {}
  refresh() {}
  getUserName() {}
}
