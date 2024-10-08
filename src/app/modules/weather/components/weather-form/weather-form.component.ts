import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-weather-form',
  templateUrl: './weather-form.component.html',
  styleUrls: ['./weather-form.component.scss']
})
export class WeatherFormComponent {
  @Input() cityName!: string;
  @Output() cityNameChange = new EventEmitter<string>();
  @Output() onSubmit = new EventEmitter<void>();

  searchIcon = faMagnifyingGlass;

  constructor() { }

  handleChange(event: string) {
    this.cityNameChange.emit(event);
  }

  handleSubmit() {
    this.onSubmit.emit();
    this.reset();
  }

  reset() {
    this.cityNameChange.emit('');
  }
}
