import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasteLeadComponent } from './paste-lead.component';

describe('PasteLeadComponent', () => {
  let component: PasteLeadComponent;
  let fixture: ComponentFixture<PasteLeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasteLeadComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PasteLeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
