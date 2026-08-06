import { SignaturePadComponent } from "@almothafar/angular-signature-pad";
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { Person } from "../../../core/models/person.class";
import { iPerson } from "../../../core/models/person.interface";
import { StateService } from "../../../core/services/state.service";

export interface iSignature {
  signer: iPerson;
  signature?: any;
  signatureDate?: Date;
  termsConfirmation: boolean;
}
@Component({
  selector: "app-program-authorizer",
  templateUrl: "./program-authorizer.component.html",
  styleUrls: ["./program-authorizer.component.css"],
  standalone: false,
})
export class ProgramAuthorizerComponent implements OnInit {
  @Input() signature: iSignature;
  @Input() isDisabled: boolean = false;
  @Input() formType: string;
  @Output() signatureChange = new EventEmitter<iSignature>();
  @ViewChild(SignaturePadComponent, { static: false })
  signaturePad: SignaturePadComponent;

  public signatureImage: any;
  wasSigned: boolean = false;
  signatureData: string;
  signingDate: string;
  terms: [string, boolean][] = [];
  CRM_HEIGHT = 125;
  CRM_WIDTH = 300;

  constructor(private stateService: StateService) {}

  ngOnInit() {
    this.terms = [
      [`I have reviewed the completed ${this.formType}; and that`, false],
      [
        `all of the information provided in this ${this.formType}, including all attachments, is accurate and correct to the best of my knowledge.`,
        false,
      ],
    ];
    if (!this.signature) {
      this.signature = {
        signer: new Person(this.stateService.currentUser.getValue()),
        termsConfirmation: false,
      };
    }
  }
  get state() {
    return this.terms
      .map((term) => term[1])
      .reduce((prev: boolean, curr: boolean) => prev && curr);
  }
  onInput() {
    if (this.state) {
      this.signature.termsConfirmation = true;
      this.signatureChange.emit(this.signature);
    }
  }

  signaturePadOptions: Object = {
    minWidth: 0.3,
    maxWidth: 2.5,
    canvasWidth: 600,
    canvasHeight: 200,
  };

  clearSignature() {
    this.wasSigned = false;
    // this.signatureData = null;
    this.signaturePad.clear();
    this.signaturePad.set("minWidth", 0.3);
    this.signaturePad.set("maxWidth", 2.5);
    this.signaturePad.set("canvasWidth", 600);
    this.signaturePad.set("canvasHeight", 200);
    this.signature.signature = null;
    this.signature.signatureDate = null;
  }

  acceptSignature() {
    if (this.wasSigned) {
      const canvas = this.signaturePad.getCanvas();

      const resizedCanvas = document.createElement("canvas");
      resizedCanvas.height = this.CRM_HEIGHT;
      resizedCanvas.width = this.CRM_WIDTH;

      const resizedContext = resizedCanvas.getContext("2d");
      resizedContext.drawImage(canvas, 0, 0, this.CRM_WIDTH, this.CRM_HEIGHT);

      const signatureData = resizedCanvas.toDataURL();

      this.signature.signature = signatureData;
      this.signature.signatureDate = new Date();
    }
  }

  drawStart() {
    this.wasSigned = true;
  }
}
