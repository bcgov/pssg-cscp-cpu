import { Component, OnInit, inject, ChangeDetectionStrategy } from "@angular/core";
import { ConfigurationStore } from "./core/store/configuration.store";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AppComponent implements OnInit {
  title = "cpu-public-app";
  readonly configStore = inject(ConfigurationStore);

  ngOnInit(): void {
    this.configStore.load();
  }
}
