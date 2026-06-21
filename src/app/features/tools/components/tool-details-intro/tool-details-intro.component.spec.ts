import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';

import { ConfigService } from '../../../../core/services/config.service';
import { ToolDetailsIntroComponent } from './tool-details-intro.component';

describe('ToolDetailsIntroComponent', () => {
  let component: ToolDetailsIntroComponent;
  let fixture: ComponentFixture<ToolDetailsIntroComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ToolDetailsIntroComponent],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            emotionOptionsState$: of({ options: [], loading: false }),
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolDetailsIntroComponent);
    component = fixture.componentInstance;
    component.tool = {
      id: 'breathing',
      enabled: true,
      category: 'therapeutic',
      template: 'therapeutic_session',
      iconKey: 'breathing',
      durationSeconds: 45,
      title: { en: 'Calm Breathing', he: 'נשימה רגועה' },
      description: {
        en: 'A short breathing exercise to calm your mind and body.',
        he: 'תרגיל נשימה קצר להרגעת הגוף והתודעה.',
      },
      recommendationTags: {
        emotions: ['Stress', 'Anxiety', 'Overwhelmed'],
        influences: [],
        moods: [1, 2, 3],
        activities: [],
      },
    };
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
