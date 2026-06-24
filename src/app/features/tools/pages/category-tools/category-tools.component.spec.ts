import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategoryToolsComponent } from './category-tools.component';

describe('CategoryToolsComponent', () => {
  let component: CategoryToolsComponent;
  let fixture: ComponentFixture<CategoryToolsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CategoryToolsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
