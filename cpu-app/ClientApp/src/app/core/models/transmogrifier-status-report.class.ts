import {
  StatusReportAnswerItemDto,
  StatusReportChildQuestionDto,
  StatusReportMcQuestionDto,
  StatusReportQuestionItemDto,
  StatusReportQuestionsDto,
} from "../api/models";
import { boolOptionSet } from "../constants/bool-optionset-values";
import { months } from "../constants/month-codes";
import { iQuestionCollection } from "./question-collection.interface";
import { iMultipleChoice, iQuestion } from "./status-report-question.interface";
// a collection of the expense item guids as K/V pairs for generating line items
export class TransmogrifierStatusReport {
  public organizationId: string;
  public organizationName: string;
  public taskId: string;
  public title: string;
  public userId: string;
  public programId: string;
  public programName: string;
  public programType: string;
  public contractedHours: number;
  public contractNumber: string;
  public reportingPeriod: string;
  public statusReportQuestions: iQuestionCollection[] = []; // this is a collection of objects
  public DataCollectionid: string;

  constructor(g: StatusReportQuestionsDto) {
    this.userId = g.userbceid; // this is the user's bceid
    this.organizationId = g.businessbceid; // this is the organization's bceid
    this.organizationName = g.organization?.name;
    this.programId = g.program?.vsd_programid;
    this.reportingPeriod = Object.keys(months).find(
      (key) => months[key] === g.reportingPeriod,
    );
    this.programType = g.programTypeCollection
      ? g.programTypeCollection
          .filter(
            (f) => g.program?._vsd_programtype_value === f.vsd_programtypeid,
          )
          .map((f) => f.vsd_name)[0]
      : null;
    this.programName = g.program?.vsd_name;
    this.contractNumber = g.contract?.vsd_name;
    this.contractedHours = g.program?.vsd_cpu_numberofhours;
    this.DataCollectionid = g.dataCollectionid;

    this.buildStatusReport(g);
  }
  private buildStatusReport(g: StatusReportQuestionsDto): void {
    (g.categoryCollection ?? []).sort(function (a, b) {
      return a.vsd_categoryorder - b.vsd_categoryorder;
    });

    let answersCollection = (g.answerCollection ?? []).reduce((acc: Record<string, any[]>, item: any) => {
      (acc[item._vsd_categoryid_value] ??= []).push(item);
      return acc;
    }, {});
    // for every category of questions collect the matching items
    for (let category of g.categoryCollection ?? []) {
      //var categoryAnswer
      const q: iQuestionCollection = {
        name: category.vsd_name,
        questions: (g.questionCollection ?? [])
          .filter(
            (q: StatusReportQuestionItemDto) =>
              category.vsd_monthlystatisticscategoryid ===
              q._vsd_categoryid_value,
          )
          .map((d: StatusReportQuestionItemDto): iQuestion => {
            // look up the value once
            const type = this.fieldType(d.vsd_questiontype);
            const q: iQuestion = {
              label: d.vsd_name,
              type,
              uuid: d.vsd_cpustatisticsmasterdataid,
              questionNumber: d.vsd_questionorder,
              categoryID: d._vsd_categoryid_value,
              multiChoiceAnswers: this.getMultipleChoice(
                d.vsd_cpustatisticsmasterdataid,
                g.multipleChoiceCollection ?? [],
              ),
              isChildQuestionExplanationRequired: false,
              tooltip: d.vsd_tooltip || null,
            };
            // instantiate the correct property with the freshest null value
            q[type] = null;

            if (g.answerCollection) {
              var answer = this.getQuestionAnswers(
                d.vsd_questionorder,
                answersCollection[d._vsd_categoryid_value],
              );
              if (answer) {
                q.number = answer.vsd_number || null;
                ((q.numberMask = answer.vsd_number
                  ? answer.vsd_number.toString()
                  : null),
                  (q.boolean =
                    answer.vsd_yesno === boolOptionSet.isTrue
                      ? true
                      : answer.vsd_yesno === boolOptionSet.isFalse
                        ? false
                        : null));
                q.string = answer.vsd_textanswer || null;
              }
            }

            // return the object
            return q;
          }),
      };

      let childQuestions: iQuestion[] = (g.childQuestionCollection ?? [])
        .filter(
          (q: StatusReportChildQuestionDto) =>
            category.vsd_monthlystatisticscategoryid ===
            q._vsd_categoryid_value,
        )
        .map((d: StatusReportChildQuestionDto): iQuestion => {
          // look up the value once
          const type = this.fieldType(d.vsd_questiontype);
          const q: iQuestion = {
            label: d.vsd_name,
            type,
            uuid: d.vsd_cpustatisticsmasterdataid, // I was generating it but may as well use the one from master data.
            questionNumber: d.vsd_questionorder + 0.5, //child questions are being given the same number for order as the parent question, so add 0.5 to push this after the parent question and remain before the next question
            categoryID: d._vsd_categoryid_value,
            multiChoiceAnswers: this.getMultipleChoice(
              d.vsd_cpustatisticsmasterdataid,
              g.multipleChoiceCollection ?? [],
            ),
            parent_id: d._vsd_parentid_value,
            isChildQuestionExplanationRequired: false,
            tooltip: d.vsd_tooltip || null,
          };
          // instantiate the correct property with the freshest null value
          q[type] = null;

          if (g.answerCollection) {
            var answer = this.getQuestionAnswers(
              d.vsd_questionorder,
              answersCollection[d._vsd_categoryid_value],
            );
            if (answer) {
              q.number = answer.vsd_number || null;
              ((q.numberMask = answer.vsd_number
                ? answer.vsd_number.toString()
                : null),
                (q.boolean =
                  answer.vsd_yesno === boolOptionSet.isTrue
                    ? true
                    : answer.vsd_yesno === boolOptionSet.isFalse
                      ? false
                      : null));
              q.string = answer.vsd_textanswer || null;
            }
          }
          // return the object
          return q;
        });

      q.questions = q.questions.concat(childQuestions).sort(function (a, b) {
        return a.questionNumber > b.questionNumber ? 1 : -1;
      });
      // push the status report questions
      this.statusReportQuestions.push(q);
    }
  }
  private getQuestionAnswers(
    order: number,
    answerCollection: StatusReportAnswerItemDto[],
  ): StatusReportAnswerItemDto {
    return (answerCollection ?? []).find((a) => a.vsd_questionorder == order);
  }

  private findParentId(
    question_id: string,
    childQuestions: StatusReportChildQuestionDto[],
  ) {
    let parent_id = "";
    let thisQuestion = childQuestions.find(
      (q) => q.vsd_cpustatisticsmasterdataid === question_id,
    );
    if (thisQuestion) {
      parent_id = thisQuestion._vsd_parentid_value;
    }
    return parent_id;
  }

  private getMultipleChoice(
    id: string,
    questionCollection: StatusReportMcQuestionDto[],
  ): iMultipleChoice[] {
    // Get multiple choice options for this question - returns only ones related to this question
    let tempQuestionCollection: iMultipleChoice[] = [];
    for (let mcQuestion of questionCollection) {
      const mc: iMultipleChoice = {
        label: mcQuestion.vsd_name,
        masterDataID: mcQuestion.vsd_cpustatisticsmasterdataanswerid,
        uuid: mcQuestion._vsd_questionid_value,
      };
      if (mc.uuid == id) {
        tempQuestionCollection.push(mc);
      }
    }
    if (tempQuestionCollection.length > 0) {
      return tempQuestionCollection;
    } else {
      return;
    }
  }

  private fieldType(d: number): string {
    // convert the field type into a string
    let type: string;
    switch (d) {
      case 100000000: {
        type = "number";
        break;
      }
      case 100000001: {
        type = "boolean";
        break;
      }
      case 100000002: {
        type = "string";
        break;
      }
      default: {
        type = undefined;
        break;
      }
    }
    return type;
  }
}
