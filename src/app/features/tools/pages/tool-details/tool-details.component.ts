import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, distinctUntilChanged, from, map, of, shareReplay, startWith, switchMap } from 'rxjs';

import { ToolDefinition } from '../../../../core/models/tool.model';
import { ToolService } from '../../../../core/services/tool.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToolDetailsIntroComponent } from '../../components/tool-details-intro/tool-details-intro.component';

interface ToolDetailsState {
  readonly loading: boolean;
  readonly tool: ToolDefinition | null;
}

@Component({
  selector: 'app-tool-details',
  standalone: true,
  imports: [AsyncPipe, IonicModule, NgIf, RouterLink, ToolDetailsIntroComponent, TranslatePipe],
  templateUrl: './tool-details.component.html',
  styleUrls: ['./tool-details.component.scss'],
})
export class ToolDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly toolService = inject(ToolService);

  readonly toolState$ = this.route.paramMap.pipe(
    map((params) => params.get('toolId')?.trim() ?? ''),
    distinctUntilChanged(),
    switchMap((toolId) => {
      if (!toolId) {
        return of<ToolDetailsState>({ loading: false, tool: null });
      }

      return from(this.toolService.getToolById(toolId)).pipe(
        map((tool): ToolDetailsState => ({ loading: false, tool })),
        catchError(() => of<ToolDetailsState>({ loading: false, tool: null })),
        startWith({ loading: true, tool: null } satisfies ToolDetailsState),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
