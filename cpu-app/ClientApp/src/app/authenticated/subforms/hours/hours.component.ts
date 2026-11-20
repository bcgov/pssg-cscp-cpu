import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from "@angular/core";
import { TIME_PATTERN } from "../../../core/constants/regex.constants";
import { uuidv4 } from "../../../core/constants/uuidv4";
import { FormHelper } from "../../../core/form-helper";
import { iHours } from "../../../core/models/hours.interface";

@Component({
  selector: "app-hours",
  templateUrl: "./hours.component.html",
  styleUrls: ["./hours.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class HoursComponent implements OnInit {
  @Input() hours: iHours;
  @Input() isDisabled: boolean = false;
  @Output() hoursChange = new EventEmitter<iHours>();
  @Input() title: string = "Hours";
  timeRegex: string = TIME_PATTERN;
  uuid: string;
  public formHelper = new FormHelper();
  constructor() {}

  ngOnInit() {
    this.uuid = uuidv4();
  }

  daysOfTheWeekSelected(): boolean {
    return (
      (this.hours.closed == null && this.hours.open == null) ||
      this.hours.monday ||
      this.hours.tuesday ||
      this.hours.wednesday ||
      this.hours.thursday ||
      this.hours.friday ||
      this.hours.saturday ||
      this.hours.sunday
    );
  }
}
