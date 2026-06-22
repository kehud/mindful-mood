import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TherapeuticSessionComponent } from './therapeutic-session.component';

describe('TherapeuticSessionComponent', () => {
  let component: TherapeuticSessionComponent;
  let fixture: ComponentFixture<TherapeuticSessionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TherapeuticSessionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TherapeuticSessionComponent);
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
      steps: [{ en: 'Inhale', he: 'שאיפה' }],
      recommendationTags: {
        emotions: [],
        influences: [],
        moods: [],
        activities: [],
      },
    };
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
