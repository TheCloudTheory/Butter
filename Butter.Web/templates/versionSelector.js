<div class="dropdown">
  <a href="#" class="btn btn-primary btn-block dropdown-toggle text-left" tabindex="0" id="version-selector-text">
Select a version <i class="icon icon-caret"></i>
  </a>
  <ul class="menu">
    {{#versions}}
    <li class="menu-item">
    <a class="version-item" href="#">
      {{.}}
    </a>
  </li>
    {{/versions}}
  </ul>
</div>