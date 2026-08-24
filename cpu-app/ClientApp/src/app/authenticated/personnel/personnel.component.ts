import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import { OrgService } from "../../core/api/services/org/org.service";
import { nameAssemble } from "../../core/constants/name-assemble";
import {
  EMAIL,
  NAME_REGEX,
  PHONE_NUMBER,
} from "../../core/constants/regex.constants";
import { FormHelper } from "../../core/form-helper";
import { ContactInformationFormFactory } from "../../core/forms/contact-information-form.factory";
import { convertPersonToDynamics } from "../../core/models/converters/person-to-dynamics";
import { convertPersonnelToDynamics } from "../../core/models/converters/personnel-to-dynamics";
import { Person } from "../../core/models/person.class";
import { iPerson } from "../../core/models/person.interface";
import { Transmogrifier } from "../../core/models/transmogrifier.class";
import { NotificationQueueService } from "../../core/services/notification-queue.service";
import { StateService } from "../../core/services/state.service";
import {
  IconStepperService,
  iStepperElement,
} from "../../shared/icon-stepper/icon-stepper.service";

@Component({
  selector: "app-personnel",
  templateUrl: "./personnel.component.html",
  styleUrls: ["./personnel.component.css"],
  standalone: false,
})
export class PersonnelComponent implements OnInit, OnDestroy {
  reload = false;
  currentStepperElement: iStepperElement;
  stepperIndex: number = 0;
  stepperElements: iStepperElement[];
  trans: Transmogrifier;
  saving: boolean = false;
  public nameAssemble = nameAssemble;
  public formHelper = new FormHelper();
  personForms: Map<string, FormGroup> = new Map();
  didLoad: boolean = false;
  private stateSubscription: Subscription;
  private formSubscriptions: Map<string, Subscription> = new Map();
  missingFields: string[] = [];

  originalPersons: iPerson[] = [];
  constructor(
    private router: Router,
    private orgService: OrgService,
    private notificationQueueService: NotificationQueueService,
    private stepperService: IconStepperService,
    private stateService: StateService,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit() {
    this.stepperService.stepperElements.subscribe(
      (e) => (this.stepperElements = e),
    );
    this.stepperService.currentStepperElement.subscribe((e) => {
      this.currentStepperElement = e;
    });
    this.stateSubscription = this.stateService.main.subscribe(
      (m: Transmogrifier) => {
        this.trans = m;
        this.originalPersons = _.cloneDeep(this.trans.persons);

        this.createPersonForms();
        this.constructStepsPerPerson(m.persons);
        this.didLoad = true;
      },
    );
  }

  ngOnDestroy() {
    if (
      JSON.stringify(this.originalPersons) !==
      JSON.stringify(this.trans.persons)
    ) {
      // console.log("setting persons back to original values")
      this.trans.persons = this.originalPersons;
    }
    this.stepperService.reset();
    this.stateSubscription.unsubscribe();

    // Unsubscribe from all form subscriptions
    this.formSubscriptions.forEach((sub) => sub.unsubscribe());
    this.formSubscriptions.clear();
  }

  createPersonForms() {
    // Clear existing forms and subscriptions
    this.formSubscriptions.forEach((sub) => sub.unsubscribe());
    this.formSubscriptions.clear();
    this.personForms.clear();

    // Create a form for each person
    this.trans.persons.forEach((person) => {
      const formGroup = this.createPersonFormGroup(person);

      if (person.me) {
        formGroup.get("firstName")?.disable({ emitEvent: false });
        formGroup.get("lastName")?.disable({ emitEvent: false });
      }

      this.personForms.set(person.personId, formGroup);

      if (person.addressSameAsAgency) {
        formGroup
          .get("address")
          ?.patchValue(this.trans.contactInformation.mainAddress, {
            emitEvent: false,
          });
        formGroup.get("address")?.disable({ emitEvent: false });
      }

      // Subscribe to form changes to update trans.persons
      const subscription = formGroup.valueChanges.subscribe((values) => {
        if (values.addressSameAsAgency) {
          formGroup
            .get("address")
            ?.patchValue(this.trans.contactInformation.mainAddress, {
              emitEvent: false,
            });
          formGroup.get("address")?.disable({ emitEvent: false });
        } else {
          formGroup.get("address")?.enable({ emitEvent: false });
          formGroup.get("address")?.reset(values.address, { emitEvent: false });
        }

        const personIndex = this.trans.persons.findIndex(
          (p) => p.personId === person.personId,
        );
        if (personIndex !== -1) {
          // Update person object with form values (use getRawValue to include disabled fields)
          Object.assign(
            this.trans.persons[personIndex],
            formGroup.getRawValue(),
          );
        }
      });

      this.formSubscriptions.set(person.personId, subscription);
    });
  }

  createPersonFormGroup(person: iPerson): FormGroup {
    return new FormGroup({
      personId: new FormControl(person.personId),
      userId: new FormControl(person.userId),
      orgId: new FormControl(person.orgId),
      me: new FormControl(person.me),
      deactivated: new FormControl(person.deactivated),
      vsd_portalfield: new FormControl(person.vsd_portalfield),
      firstName: new FormControl(person.firstName || "", [
        Validators.required,
        Validators.pattern(NAME_REGEX),
      ]),
      middleName: new FormControl(person.middleName || "", [
        Validators.pattern(NAME_REGEX),
      ]),
      lastName: new FormControl(
        { value: person.lastName || "", disabled: person.me },
        [Validators.required, Validators.pattern(NAME_REGEX)],
      ),
      title: new FormControl(person.title || "", [Validators.required]),
      email: new FormControl(person.email || "", [
        Validators.required,
        Validators.pattern(EMAIL),
      ]),
      phone2: new FormControl(person.phone2 || "", [
        Validators.required,
        Validators.pattern(PHONE_NUMBER),
      ]),
      phone2Extension: new FormControl(person.phone2Extension || ""),
      phone: new FormControl(person.phone || "", [
        Validators.pattern(PHONE_NUMBER),
      ]),
      phoneExtension: new FormControl(person.phoneExtension || ""),
      fax: new FormControl(person.fax || "", [
        Validators.pattern(PHONE_NUMBER),
      ]),
      addressSameAsAgency: new FormControl(person.addressSameAsAgency || false),
      address: ContactInformationFormFactory.createAddressFormGroup(
        this.formBuilder,
        person.address,
      ),
      employmentStatus: new FormControl(person.employmentStatus || "", [
        Validators.required,
      ]),
    });
  }

  getPersonForm(personId: string): FormGroup {
    return this.personForms.get(personId);
  }

  constructStepsPerPerson(persons: iPerson[]): void {
    this.stepperService.reset();
    if (persons) {
      persons.sort(function (a, b) {
        let name1 = nameAssemble(a.firstName, a.middleName, a.lastName);
        let name2 = nameAssemble(b.firstName, b.middleName, b.lastName);
        return name1 > name2 ? 1 : name1 < name2 ? -1 : 0;
      });
      const validPersons = persons.filter((p) => p.personId);

      validPersons.forEach((person) => {
        this.stepperService.addStepperElement(
          person,
          nameAssemble(person.firstName, person.middleName, person.lastName),
          null,
          "person",
        );
      });
      if (!this.didLoad) {
        this.stepperService.setToFirstStepperElement();
      } else {
        this.stepperService.setCurrentStepperElement(
          this.stepperElements[this.stepperIndex].id,
        );
      }
    }
  }

  save() {
    this.savePerson()
      .then(() => {
        // set form state
        this.stepperService.setStepperElementProperty(
          this.currentStepperElement.id,
          "formState",
          "complete",
        );

        // select next stepper element after save
        if (this.stepperElements && this.stepperElements.length > 0) {
          if (this.stepperIndex < this.stepperElements.length - 1) {
            this.stepperIndex++;
          }
          this.stepperService.setCurrentStepperElement(
            this.stepperElements[this.stepperIndex].id,
          );
        }

        this.formHelper.makeFormClean();
      })
      .catch(() => {
        this.stepperService.setStepperElementProperty(
          this.currentStepperElement.id,
          "formState",
          "invalid",
        );
      });
  }

  saveAndExit() {
    this.savePerson()
      .then(() => {
        this.router.navigate(["/authenticated/dashboard"]);
      })
      .catch(() => {});
  }

  private savePerson() {
    return new Promise<void>((resolve, reject) => {
      const personId = this.currentStepperElement.object["personId"];
      const personForm = this.getPersonForm(personId);

      if (!personForm) {
        console.debug("No form found for the current person.");
        reject();
        return;
      }

      personForm.markAllAsTouched();

      try {
        if (personForm.invalid) {
          this.notificationQueueService.addNotification(
            "Please fill in all required fields and ensure all fields are in the correct format.",
            "warning",
          );
          reject();
          return;
        }

        this.saving = true;

        const personFormValue = new Person(personForm.getRawValue());
        if (personFormValue.personId.toString().startsWith("temp-")) {
          personFormValue.personId = null; // Clear temp ID before sending to backend
        }

        const userId = this.stateService.main.getValue().userId;
        const organizationId = this.stateService.main.getValue().organizationId;
        const personDynamicsModel = convertPersonnelToDynamics(
          userId,
          organizationId,
          [personFormValue],
        );
        this.orgService.setStaff(personDynamicsModel).subscribe(
          (r) => {
            if (r.isSuccess) {
              this.saving = false;
              this.notificationQueueService.addNotification(
                `Information is saved for ${nameAssemble(personFormValue.firstName, personFormValue.middleName, personFormValue.lastName)}`,
                "success",
              );
              this.stateService.refresh();
              resolve();
            } else {
              this.notificationQueueService.addNotification(
                "There was a problem saving this person. If this problem is persisting please contact your ministry representative.",
                "danger",
              );
              this.saving = false;
              reject();
            }
          },
          (err) => {
            this.notificationQueueService.addNotification(err, "danger");
            this.saving = false;
            reject();
          },
        );
      } catch (err) {
        console.log(err);
        this.notificationQueueService.addNotification(
          "The agency staff could not be saved. If this problem is persisting please contact your ministry representative.",
          "danger",
        );
        this.saving = false;
        reject();
      }
    });
  }

  cancel(person: iPerson) {
    let reset = _.cloneDeep(this.originalPersons);
    if (this.currentStepperElement.itemName === "New Person") {
      let temp = new Person();
      reset.push(temp);
    }
    this.trans.persons = reset;

    this.exit();
  }

  exit() {
    if (this.formHelper.isFormDirty()) {
      if (
        confirm(
          "Are you sure you want to return to the dashboard? All unsaved work will be lost.",
        )
      ) {
        this.stateService.refresh();
        this.router.navigate(["/authenticated/dashboard"]);
      }
    } else {
      this.stateService.refresh();
      this.router.navigate(["/authenticated/dashboard"]);
    }
  }

  add() {
    const person = new Person();
    person.personId = `temp-${Math.random().toString(36).substr(2, 9)}`; // Temporary ID for tracking
    this.stepperService.addStepperElement(person, "New Person", null, "person");
    this.trans.persons.push(person);

    // Create a form for the new person
    const formGroup = this.createPersonFormGroup(person);
    this.personForms.set(person.personId, formGroup);

    // Subscribe to form changes
    const subscription = formGroup.valueChanges.subscribe((values) => {
      const personIndex = this.trans.persons.findIndex(
        (p) => p.personId === person.personId,
      );
      if (personIndex !== -1) {
        Object.assign(this.trans.persons[personIndex], formGroup.getRawValue());
      }
    });

    this.formSubscriptions.set(person.personId, subscription);
  }

  remove(person: iPerson) {
    try {
      if (!person.personId) {
        this.stateService.refresh();
      } else if (
        !person.me &&
        confirm(
          `Are you sure that you want to deactivate ${person.firstName} ${person.lastName}? This user will no longer be available in the system.`,
        )
      ) {
        this.saving = true;
        person.deactivated = true;
        const userId = this.stateService.main.getValue().userId;
        const organizationId = this.stateService.main.getValue().organizationId;
        const post = {
          userBCeID: userId,
          businessBCeID: organizationId,
          staffCollection: [convertPersonToDynamics(person) as any],
        };
        this.orgService.setStaff(post).subscribe((r) => {
          if (r.isSuccess) {
            this.saving = false;

            const stepperId = this.stepperElements[this.stepperIndex].id;
            this.stepperService.removeStepperElement(stepperId);
            this.trans.persons.splice(
              this.trans.persons.findIndex(
                (p) => p.personId === person.personId,
              ),
              1,
            );

            // select next stepper element after save
            if (this.stepperElements && this.stepperElements.length > 0) {
              if (this.stepperIndex === this.stepperElements.length) {
                this.stepperIndex--;
              }

              this.stepperService.setCurrentStepperElement(
                this.stepperElements[this.stepperIndex].id,
              );
            }
          } else {
            this.notificationQueueService.addNotification(
              "The agency staff could not be saved. If this problem is persisting please contact your ministry representative.",
              "danger",
            );
            this.saving = false;
          }
        });
      }
    } catch (err) {
      console.log(err);
      this.notificationQueueService.addNotification(
        "The agency staff could not be saved. If this problem is persisting please contact your ministry representative.",
        "danger",
      );
      this.saving = false;
    }
  }

  onChange(element: iStepperElement) {
    this.missingFields = [];
    element.itemName = nameAssemble(
      element.object["firstName"],
      element.object["middleName"],
      element.object["lastName"],
    );
    this.stepperService.setStepperElement(element);
  }
}
