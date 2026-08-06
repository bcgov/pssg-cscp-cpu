// import { HttpClient, HttpHeaders } from "@angular/common/http";
// import { Injectable } from "@angular/core";
// import { Observable, throwError } from "rxjs";
// import { catchError, retry } from "rxjs/operators";
// import { environment } from "../../../environments/environment";
// import { iDynamicsBlob } from "../models/dynamics-blob";

// @Injectable({
//   providedIn: "root",
// })
// export class MainService {
export {};
//   baseUrl = environment.apiRootUrl;
//   apiPath = this.baseUrl.concat("api/cpuorgcontracts");

//   constructor(private http: HttpClient) {}

//   getBlob(userId: string, organizationId: string): Observable<iDynamicsBlob> {
//     return this.http
//       .get<iDynamicsBlob>(`${this.apiPath}/${organizationId}/${userId}`, {
//         headers: this.headers,
//       })
//       .pipe(retry(3), catchError(this.handleError));
//   }
//   get headers(): HttpHeaders {
//     return new HttpHeaders({ "Content-Type": "application/json" });
//   }
//   protected handleError(err): Observable<never> {
//     let errorMessage = "";
//     if (err.error instanceof ErrorEvent) {
//       // A client-side or network error occurred. Handle it accordingly.
//       errorMessage = err.error.message;
//     } else {
//       // The backend returned an unsuccessful response code.
//       // The response body may contain clues as to what went wrong,
//       errorMessage = `Backend returned code ${err.status}, body was: ${err.message}`;
//     }
//     return throwError(errorMessage);
//   }
// }
