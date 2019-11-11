import { ChangeDetectionStrategy, Component } from "@angular/core";

interface Quill{
  getModule(moduleName: string);
}

interface BetterTableModule {
  insertTable(rows: number, columns: number): void;
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent {
  public quill: Quill;
  private get tableModule(): BetterTableModule {
    return this.quill.getModule("better-table");
  }

  public editorCreated(event:Quill): void {
    this.quill = event;
    // Example on how to add new table to editor
    this.addNewtable();
  }

  private addNewtable(): void {
   this.tableModule.insertTable(3, 3);
 }
}