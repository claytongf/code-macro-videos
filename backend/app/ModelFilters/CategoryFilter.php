<?php

namespace App\ModelFilters;

use Illuminate\Database\Eloquent\Builder;

class CategoryFilter extends DefaultModelFilter
{
    protected $sortable = ['name', 'is_active', 'created_at'];

    public function search($search)
    {
        $this->query->where('name', 'LIKE', "%$search%");
    }

    public function genres($genres)
    {
        $ids = explode(',', $genres);
        $this->whereHas('genres', function (Builder $q) use ($ids) {
            $q->whereIn('id', $ids);
        });
    }

    public function isActive($isActive)
    {
        $this->where('is_active', $isActive);
    }
}
