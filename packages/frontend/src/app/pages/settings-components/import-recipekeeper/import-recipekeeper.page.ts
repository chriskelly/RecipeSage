import { Component } from "@angular/core";
import { NavController, ToastController } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";

import { LoadingRef, LoadingService } from "~/services/loading.service";
import { RecipeService } from "~/services/recipe.service";
import { UtilService, RouteMap, AuthType } from "~/services/util.service";

@Component({
  selector: "page-import-recipekeeper",
  templateUrl: "import-recipekeeper.page.html",
  styleUrls: ["import-recipekeeper.page.scss"],
})
export class ImportRecipeKeeperPage {
  defaultBackHref: string = RouteMap.ImportPage.getPath();

  loading?: LoadingRef;
  imageFile?: File;

  ignoreLargeFiles: boolean;

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public loadingService: LoadingService,
    public toastCtrl: ToastController,
    public recipeService: RecipeService,
    public utilService: UtilService,
  ) {
    this.ignoreLargeFiles = !!localStorage.getItem("largeFileOverride");
  }

  setFile(event: any) {
    const files = (event.srcElement || event.target).files;
    if (!files) {
      return;
    }

    this.imageFile = files[0];
  }

  filePicker() {
    document.getElementById("filePicker")?.click();
  }

  isFileTooLarge() {
    if (
      !this.ignoreLargeFiles &&
      this.imageFile &&
      this.imageFile.size / 1024 / 1024 > 550
    ) {
      // File is larger than 550MB
      return true;
    }
    return false;
  }

  showFileTypeWarning() {
    if (!this.imageFile || !this.imageFile.name) return false;
    return !this.imageFile.name.toLowerCase().endsWith(".zip");
  }

  async presentToast(msg: string) {
    (
      await this.toastCtrl.create({
        message: msg,
        duration: 6000,
      })
    ).present();
  }

  async submit() {
    if (!this.imageFile) return;

    this.loading = this.loadingService.start();

    const showFileError = async () => {
      const message = await this.translate
        .get("pages.importRecipeKeeper.error")
        .toPromise();
      const close = await this.translate.get("generic.close").toPromise();

      (
        await this.toastCtrl.create({
          message,
          buttons: [
            {
              text: close,
              role: "cancel",
            },
          ],
        })
      ).present();
    };

    const response = await this.recipeService.importRecipeKeeper(
      this.imageFile,
      {
        400: showFileError,
        406: showFileError,
        504: async () => {
          setTimeout(async () => {
            const message = await this.translate
              .get("pages.importRecipeKeeper.timeout")
              .toPromise();
            const close = await this.translate.get("generic.close").toPromise();

            (
              await this.toastCtrl.create({
                message,
                buttons: [
                  {
                    text: close,
                    role: "cancel",
                  },
                ],
              })
            ).present();
            this.navCtrl.navigateRoot(RouteMap.HomePage.getPath("main"));
          }, 20000);
        },
      },
    );
    this.loading.dismiss();
    this.loading = undefined;
    if (!response.success) return;

    const message = await this.translate
      .get("pages.importRecipeKeeper.success")
      .toPromise();

    this.presentToast(message);

    this.navCtrl.navigateRoot(RouteMap.HomePage.getPath("main"));
  }
}
