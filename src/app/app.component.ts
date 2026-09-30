import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideArrowUpRight,
  lucideCircleCheck,
  lucideClipboardPaste,
  lucideClock,
  lucideDownload,
  lucideExternalLink,
  lucideGlobe,
  lucideHouse,
  lucideLayoutDashboard,
  lucideMap,
  lucideMapPin,
  lucidePencil,
  lucidePlus,
  lucideSearch,
  lucideSparkles,
  lucideTrash2,
  lucideTriangleAlert,
  lucideUsers,
  lucideUsersRound,
  lucideX,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
  providers: [provideIcons({
    lucideArrowRight,
    lucideArrowUpRight,
    lucideCircleCheck,
    lucideClipboardPaste,
    lucideClock,
    lucideDownload,
    lucideExternalLink,
    lucideGlobe,
    lucideHouse,
    lucideLayoutDashboard,
    lucideMap,
    lucideMapPin,
    lucidePencil,
    lucidePlus,
    lucideSearch,
    lucideSparkles,
    lucideTrash2,
    lucideTriangleAlert,
    lucideUsers,
    lucideUsersRound,
    lucideX,
  })],
  templateUrl: './app.component.html', styleUrl: './app.component.css'
})
export class AppComponent {
  readonly currentYear = new Date().getFullYear();
}
