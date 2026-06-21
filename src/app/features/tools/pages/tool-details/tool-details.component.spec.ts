import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';

import { ToolService } from '../../../../core/services/tool.service';
import { ToolDetailsPage } from './tool-details.component';

describe('ToolDetailsComponent', () => {
  let component: ToolDetailsPage;
  let fixture: ComponentFixture<ToolDetailsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ToolDetailsPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['toolId', 'breathing']])),
          },
        },
        {
          provide: ToolService,
          useValue: {
            getToolById: () => Promise.resolve(null),
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
